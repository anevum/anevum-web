import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote
from zoneinfo import ZoneInfo

import httpx
from fastapi import Header, HTTPException

log = logging.getLogger("anevum.alpaca")
ET = ZoneInfo("America/New_York")
UTC = timezone.utc
CLIENT_PREFIX = "anevum-orb-"


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def _float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except Exception:
        return default


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except Exception:
        return default


class AlpacaAutomation:
    def __init__(self):
        self.api_key = os.getenv("APCA_API_KEY_ID", "").strip()
        self.api_secret = os.getenv("APCA_API_SECRET_KEY", "").strip()
        self.trading_mode = os.getenv("ALPACA_TRADING_MODE", "paper").strip().lower()
        self.live_enabled = _bool("ALPACA_LIVE_TRADING", False)
        self.armed = _bool("ALPACA_ARMED", True)
        self.data_feed = os.getenv("ALPACA_DATA_FEED", "iex").strip().lower()

        self.trading_base = (
            "https://api.alpaca.markets"
            if self.trading_mode == "live" and self.live_enabled
            else "https://paper-api.alpaca.markets"
        )
        self.data_base = "https://data.alpaca.markets"
        self.mode = "live" if self.trading_base == "https://api.alpaca.markets" else "paper"

        self.universe = [
            symbol.strip().upper()
            for symbol in os.getenv("STRATEGY_UNIVERSE", "SPY,QQQ,SMH").split(",")
            if symbol.strip()
        ]
        self.capital_cap = _float("CAPITAL_CAP_USD", 121.0)
        self.max_position_pct = _float("MAX_POSITION_PCT", 0.90)
        self.risk_per_trade_pct = _float("RISK_PER_TRADE_PCT", 0.02)
        self.max_daily_loss_pct = _float("MAX_DAILY_LOSS_PCT", 0.05)
        self.max_trades_per_day = _int("MAX_TRADES_PER_DAY", 3)
        self.stop_pct = _float("STOP_PCT", 0.006)
        self.target_r = _float("TARGET_R_MULT", 1.8)
        self.breakout_buffer_pct = _float("BREAKOUT_BUFFER_PCT", 0.0005)
        self.max_chase_pct = _float("MAX_CHASE_PCT", 0.006)
        self.volume_multiplier = _float("VOLUME_MULTIPLIER", 1.30)
        self.loop_seconds = max(5, _int("LOOP_SECONDS", 15))

        self.trade_start = os.getenv("TRADE_START_ET", "09:35").strip()
        self.trade_end = os.getenv("TRADE_END_ET", "11:30").strip()
        self.flatten_time = os.getenv("FLATTEN_ET", "15:50").strip()

        self.state: dict[str, Any] = {
            "startedAt": datetime.now(UTC).isoformat(),
            "configured": bool(self.api_key and self.api_secret),
            "armed": self.armed,
            "mode": self.mode,
            "strategy": "opening_range_breakout_5m",
            "universe": self.universe,
            "lastCycle": None,
            "lastError": None,
            "lastSignal": None,
            "lastOrder": None,
            "lastFlatten": None,
            "blockedReason": None,
        }

    def _headers(self) -> dict[str, str]:
        return {
            "APCA-API-KEY-ID": self.api_key,
            "APCA-API-SECRET-KEY": self.api_secret,
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, url: str, *, params=None, body=None, ok=(200, 201, 204, 207)):
        if not self.api_key or not self.api_secret:
            raise RuntimeError("Alpaca API credentials are not configured.")
        timeout = httpx.Timeout(12.0, connect=8.0)
        async with httpx.AsyncClient(timeout=timeout, headers=self._headers()) as client:
            response = await client.request(method, url, params=params, json=body)
        if response.status_code not in ok:
            raise RuntimeError(
                f"{method} {url} -> {response.status_code}: {response.text[:500]}"
            )
        if response.status_code == 204 or not response.content:
            return None
        try:
            return response.json()
        except Exception:
            return response.text

    async def account(self):
        return await self._request("GET", f"{self.trading_base}/v2/account")

    async def clock(self):
        return await self._request("GET", f"{self.trading_base}/v2/clock")

    async def positions(self):
        value = await self._request("GET", f"{self.trading_base}/v2/positions")
        return value if isinstance(value, list) else []

    async def orders(self, *, status="all", after=None, nested=True, limit=500):
        params = {
            "status": status,
            "direction": "asc",
            "nested": str(nested).lower(),
            "limit": str(limit),
        }
        if after:
            params["after"] = after
        value = await self._request(
            "GET", f"{self.trading_base}/v2/orders", params=params
        )
        return value if isinstance(value, list) else []

    async def bars(self, symbols, start, end):
        params = {
            "symbols": ",".join(symbols),
            "timeframe": "1Min",
            "start": start.astimezone(UTC).isoformat().replace("+00:00", "Z"),
            "end": end.astimezone(UTC).isoformat().replace("+00:00", "Z"),
            "limit": "10000",
            "adjustment": "raw",
            "feed": self.data_feed,
            "sort": "asc",
        }
        value = await self._request(
            "GET", f"{self.data_base}/v2/stocks/bars", params=params
        )
        return (value or {}).get("bars", {}) or {}

    @staticmethod
    def _market_open(now_et):
        return now_et.replace(hour=9, minute=30, second=0, microsecond=0)

    @staticmethod
    def _tagged(order):
        return str(order.get("client_order_id") or "").startswith(CLIENT_PREFIX)

    def _filled_entries_today(self, orders):
        return sum(
            1
            for order in orders
            if self._tagged(order)
            and str(order.get("side", "")).lower() == "buy"
            and str(order.get("status", "")).lower() in {"filled", "partially_filled"}
        )

    def _open_tagged_orders(self, orders):
        terminal = {
            "filled",
            "canceled",
            "expired",
            "rejected",
            "replaced",
            "done_for_day",
        }
        return [
            order
            for order in orders
            if self._tagged(order)
            and str(order.get("status", "")).lower() not in terminal
        ]

    async def _today_tagged_symbols(self):
        now_et = datetime.now(ET)
        market_open = self._market_open(now_et)
        orders = await self.orders(
            status="all",
            after=market_open.astimezone(UTC).isoformat(),
            nested=True,
        )
        return {
            str(order.get("symbol") or "").upper()
            for order in orders
            if self._tagged(order)
            and str(order.get("side") or "").lower() == "buy"
            and str(order.get("status") or "").lower()
            in {"filled", "partially_filled"}
        }

    async def cancel_tagged_orders(self):
        orders = await self.orders(status="open", nested=True)
        for order in orders:
            if not self._tagged(order):
                continue
            order_id = order.get("id")
            if not order_id:
                continue
            try:
                await self._request(
                    "DELETE",
                    f"{self.trading_base}/v2/orders/{order_id}",
                    ok=(204, 422),
                )
            except Exception as exc:
                log.warning("Alpaca order cancel failed for %s: %s", order_id, exc)

    async def flatten(self, reason: str):
        tagged_symbols = await self._today_tagged_symbols()
        try:
            await self.cancel_tagged_orders()
        except Exception as exc:
            log.warning("Alpaca tagged-order cancel during flatten failed: %s", exc)

        current = await self.positions()
        closed = []
        for position in current:
            symbol = str(position.get("symbol") or "").upper()
            if symbol not in tagged_symbols:
                continue
            try:
                await self._request(
                    "DELETE",
                    f"{self.trading_base}/v2/positions/{quote(symbol)}",
                    params={"percentage": "100"},
                    ok=(200,),
                )
                closed.append(symbol)
            except Exception as exc:
                log.error("Alpaca close failed for %s: %s", symbol, exc)

        self.state["lastFlatten"] = {
            "at": datetime.now(UTC).isoformat(),
            "reason": reason,
            "symbols": closed,
        }
        return self.state["lastFlatten"]

    @staticmethod
    def _daily_pnl(account):
        try:
            return float(account.get("equity") or 0) - float(
                account.get("last_equity") or 0
            )
        except Exception:
            return 0.0

    def _effective_capital(self, account):
        values = []
        for key in ("equity", "cash", "buying_power"):
            try:
                value = float(account.get(key) or 0)
                if value > 0:
                    values.append(value)
            except Exception:
                pass
        actual = min(values) if values else self.capital_cap
        return max(0.0, min(self.capital_cap, actual))

    def _quantity(self, price, capital):
        if price <= 0 or capital <= 0:
            return 0.0
        risk_dollars = capital * self.risk_per_trade_pct
        risk_limited_notional = risk_dollars / max(self.stop_pct, 0.0001)
        position_notional = min(
            capital * self.max_position_pct, risk_limited_notional
        )
        return max(0.0, round(position_notional / price, 6))

    async def submit_bracket(self, symbol, reference_price, capital):
        quantity = self._quantity(reference_price, capital)
        if quantity <= 0:
            raise RuntimeError("Calculated Alpaca order quantity is zero.")

        stop = round(reference_price * (1.0 - self.stop_pct), 2)
        target = round(
            reference_price * (1.0 + self.stop_pct * self.target_r), 2
        )
        client_id = (
            f"{CLIENT_PREFIX}{datetime.now(ET):%Y%m%d-%H%M%S}-{symbol.lower()}"
        )
        payload = {
            "symbol": symbol,
            "qty": str(quantity),
            "side": "buy",
            "type": "market",
            "time_in_force": "day",
            "order_class": "bracket",
            "take_profit": {"limit_price": str(target)},
            "stop_loss": {"stop_price": str(stop)},
            "client_order_id": client_id,
        }

        order = await self._request(
            "POST",
            f"{self.trading_base}/v2/orders",
            body=payload,
            ok=(200, 201),
        )
        self.state["lastOrder"] = {
            "at": datetime.now(UTC).isoformat(),
            "symbol": symbol,
            "quantity": quantity,
            "referencePrice": reference_price,
            "stop": stop,
            "target": target,
            "clientOrderId": client_id,
            "brokerOrderId": order.get("id") if isinstance(order, dict) else None,
        }
        return order

    def select_signal(self, bars_by_symbol, now_et):
        open_dt = self._market_open(now_et)
        opening_end = open_dt + timedelta(minutes=5)
        candidates = []

        for symbol in self.universe:
            raw_bars = bars_by_symbol.get(symbol, [])
            normalized = []
            for bar in raw_bars:
                try:
                    timestamp = datetime.fromisoformat(
                        str(bar["t"]).replace("Z", "+00:00")
                    ).astimezone(ET)
                    normalized.append((timestamp, bar))
                except Exception:
                    continue

            opening = [
                bar for timestamp, bar in normalized
                if open_dt <= timestamp < opening_end
            ]
            after = [
                bar for timestamp, bar in normalized
                if timestamp >= opening_end
            ]
            if len(opening) < 4 or not after:
                continue

            opening_high = max(float(bar["h"]) for bar in opening)
            opening_low = min(float(bar["l"]) for bar in opening)
            latest = after[-1]
            price = float(latest["c"])
            latest_volume = float(latest.get("v") or 0)
            previous = after[-6:-1] if len(after) >= 6 else after[:-1]
            average_volume = (
                sum(float(bar.get("v") or 0) for bar in previous)
                / len(previous)
                if previous
                else 0.0
            )

            breakout = opening_high * (1.0 + self.breakout_buffer_pct)
            chase_ceiling = opening_high * (1.0 + self.max_chase_pct)
            price_ok = breakout <= price <= chase_ceiling
            volume_ok = (
                average_volume <= 0
                or latest_volume >= average_volume * self.volume_multiplier
            )
            if not (price_ok and volume_ok):
                continue

            score = (
                (price / opening_high) - 1.0
                + min(latest_volume / max(average_volume, 1.0), 5.0) * 0.001
            )
            candidates.append(
                {
                    "symbol": symbol,
                    "price": price,
                    "openingHigh": opening_high,
                    "openingLow": opening_low,
                    "openingRangePct": (
                        (opening_high - opening_low) / max(opening_low, 0.01)
                    ),
                    "latestVolume": latest_volume,
                    "averageRecentVolume": average_volume,
                    "score": score,
                }
            )

        if not candidates:
            return None
        candidates.sort(key=lambda item: item["score"], reverse=True)
        return candidates[0]

    async def cycle(self):
        now_et = datetime.now(ET)
        self.state["lastCycle"] = datetime.now(UTC).isoformat()
        self.state["lastError"] = None
        self.state["blockedReason"] = None

        if not self.armed:
            self.state["blockedReason"] = "disarmed"
            return
        if not self.api_key or not self.api_secret:
            self.state["blockedReason"] = "missing_credentials"
            return
        if self.trading_mode == "live" and not self.live_enabled:
            self.state["blockedReason"] = "live_mode_not_explicitly_enabled"
            return
        if now_et.weekday() >= 5:
            self.state["blockedReason"] = "weekend"
            return

        clock = await self.clock()
        if not bool(clock.get("is_open")):
            self.state["blockedReason"] = "market_closed"
            return

        account = await self.account()
        if bool(account.get("trading_blocked")):
            self.state["blockedReason"] = "broker_trading_blocked"
            return

        pnl = self._daily_pnl(account)
        daily_loss_limit = self.capital_cap * self.max_daily_loss_pct
        if pnl <= -daily_loss_limit:
            self.state["blockedReason"] = f"daily_loss_limit:{pnl:.2f}"
            await self.flatten("daily_loss_limit")
            return

        current_hhmm = now_et.strftime("%H:%M")
        if current_hhmm >= self.flatten_time:
            self.state["blockedReason"] = "after_flatten_time"
            await self.flatten("scheduled_flatten")
            return
        if not (self.trade_start <= current_hhmm <= self.trade_end):
            self.state["blockedReason"] = "outside_entry_window"
            return

        market_open = self._market_open(now_et)
        orders = await self.orders(
            status="all",
            after=market_open.astimezone(UTC).isoformat(),
            nested=True,
        )
        if self._open_tagged_orders(orders):
            self.state["blockedReason"] = "strategy_order_open"
            return

        positions = await self.positions()
        tagged_symbols = await self._today_tagged_symbols()
        if any(
            str(position.get("symbol") or "").upper() in tagged_symbols
            for position in positions
        ):
            self.state["blockedReason"] = "strategy_position_open"
            return

        if self._filled_entries_today(orders) >= self.max_trades_per_day:
            self.state["blockedReason"] = "max_trades_reached"
            return

        bars = await self.bars(self.universe, market_open, now_et)
        signal = self.select_signal(bars, now_et)
        self.state["lastSignal"] = signal
        if not signal:
            self.state["blockedReason"] = "no_valid_signal"
            return

        capital = self._effective_capital(account)
        if capital < 5:
            self.state["blockedReason"] = "insufficient_capital"
            return

        await self.submit_bracket(
            signal["symbol"], float(signal["price"]), capital
        )

    async def loop(self):
        await asyncio.sleep(3)
        while True:
            try:
                await self.cycle()
            except Exception as exc:
                self.state["lastError"] = f"{type(exc).__name__}: {exc}"
                log.exception("Alpaca automation cycle failed.")
            await asyncio.sleep(self.loop_seconds)

    async def status(self):
        value = dict(self.state)
        value["risk"] = {
            "capitalCapUsd": self.capital_cap,
            "maxPositionPct": self.max_position_pct,
            "riskPerTradePct": self.risk_per_trade_pct,
            "maxDailyLossPct": self.max_daily_loss_pct,
            "maxTradesPerDay": self.max_trades_per_day,
            "stopPct": self.stop_pct,
            "targetRMultiple": self.target_r,
            "entryWindowEt": f"{self.trade_start}-{self.trade_end}",
            "flattenEt": self.flatten_time,
        }
        if self.api_key and self.api_secret:
            try:
                account = await self.account()
                value["account"] = {
                    "equity": account.get("equity"),
                    "cash": account.get("cash"),
                    "buyingPower": account.get("buying_power"),
                    "lastEquity": account.get("last_equity"),
                    "tradingBlocked": account.get("trading_blocked"),
                    "dailyPnlUsd": self._daily_pnl(account),
                }
                value["positions"] = await self.positions()
            except Exception as exc:
                value["accountError"] = str(exc)
        return value


def register_alpaca(app, require_command_admin):
    automation = AlpacaAutomation()

    @app.on_event("startup")
    async def _start_alpaca_worker():
        asyncio.create_task(automation.loop())

    @app.get("/v1/trading/alpaca/status")
    async def alpaca_status(authorization: str | None = Header(default=None)):
        await require_command_admin(authorization)
        return await automation.status()

    @app.post("/v1/trading/alpaca/arm")
    async def alpaca_arm(authorization: str | None = Header(default=None)):
        await require_command_admin(authorization)
        if not automation.api_key or not automation.api_secret:
            raise HTTPException(503, "Alpaca API credentials are not configured.")
        if automation.trading_mode == "live" and not automation.live_enabled:
            raise HTTPException(409, "Live Alpaca trading is not explicitly enabled.")
        automation.armed = True
        automation.state["armed"] = True
        return {"ok": True, "armed": True, "mode": automation.mode}

    @app.post("/v1/trading/alpaca/disarm")
    async def alpaca_disarm(authorization: str | None = Header(default=None)):
        await require_command_admin(authorization)
        automation.armed = False
        automation.state["armed"] = False
        return {"ok": True, "armed": False, "mode": automation.mode}

    @app.post("/v1/trading/alpaca/flatten")
    async def alpaca_flatten(authorization: str | None = Header(default=None)):
        await require_command_admin(authorization)
        automation.armed = False
        automation.state["armed"] = False
        result = await automation.flatten("manual_command")
        return {"ok": True, "armed": False, "flatten": result}

    return automation
