import asyncio
import math
import os
import time
from datetime import datetime, timezone
from threading import Lock

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ib_async import IB
from alpaca_worker import register_alpaca

app = FastAPI(title="ANEVUM Finance Telemetry", version="3.0")

ALLOWED_ORIGINS = [
    value.strip()
    for value in os.getenv(
        "ALLOWED_ORIGINS",
        "https://anevum.com,https://www.anevum.com,https://command.anevum.com",
    ).split(",")
    if value.strip()
]
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
IB_HOST = os.getenv("IB_GATEWAY_HOST", "ib-gateway.railway.internal")
IB_PORT = int(os.getenv("IB_GATEWAY_PORT", "4003"))
IB_CLIENT_ID = int(os.getenv("IB_CLIENT_ID", "73"))
CACHE_TTL = max(2, int(os.getenv("REFRESH_TTL_SECONDS", "4")))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,
)

_cache = {"at": 0.0, "value": None}
_cache_lock = Lock()


def finite(value, default=None):
    try:
        number = float(value)
        return number if math.isfinite(number) else default
    except Exception:
        return default


def tag_value(rows, tag):
    for row in rows:
        if getattr(row, "tag", "") == tag:
            return finite(getattr(row, "value", None))
    return None


async def require_command_admin(authorization: str | None):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "RHENLINK session required.")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(503, "Finance authentication is not configured.")

    token = authorization.split(" ", 1)[1].strip()
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_KEY,
                    "Accept": "application/json",
                },
            )
    except Exception as exc:
        raise HTTPException(503, f"RHENLINK verification unavailable: {type(exc).__name__}") from exc

    if response.status_code != 200:
        raise HTTPException(401, "RHENLINK session is invalid or expired.")

    user = response.json()
    metadata = user.get("app_metadata") or {}
    role = str(metadata.get("role") or "").strip().lower()
    email = str(user.get("email") or "").strip().lower()
    allowed = (
        email == "devon@anevum.com"
        or metadata.get("command_admin") is True
        or metadata.get("wiki_admin") is True
        or role in {"owner", "founder", "admin", "command_admin", "wiki_admin"}
    )
    if not allowed:
        raise HTTPException(403, "COMMAND administrator authorization required.")


def offline_snapshot(reason: str):
    return {
        "version": "3.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "READ_ONLY",
        "gateway": {
            "connected": False,
            "host": IB_HOST,
            "port": IB_PORT,
            "reason": reason,
        },
        "account": None,
        "positions": [],
        "quotes": [],
        "strategy": {
            "name": "ANEVUM HOLDINGS MONITOR",
            "timeframe": "LIVE",
            "rules": {
                "trend": "Read-only holdings telemetry",
                "entry": "Informational only",
                "exit": "Informational only",
                "stop": "No automated orders",
                "universe": ["QQQM", "SMH"],
                "positionBudgetUsd": 0,
                "maxPlannedLossUsd": 0,
                "commissionBufferUsd": 0,
            },
            "setups": [
                {
                    "symbol": symbol,
                    "status": "GATEWAY_OFFLINE",
                    "signal": "NO_TRADE",
                    "reason": reason,
                    "chart": [],
                }
                for symbol in ("QQQM", "SMH")
            ],
        },
        "persistence": {
            "equityHistory": "not_persisted",
            "reason": "COMMAND never fabricates portfolio history.",
        },
    }


def build_snapshot():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    ib = IB()
    try:
        ib.connect(IB_HOST, IB_PORT, clientId=IB_CLIENT_ID, timeout=3, readonly=True)
        if not ib.isConnected():
            return offline_snapshot("IBKR Gateway did not accept the API connection.")

        rows = list(ib.accountSummary()) + list(ib.accountValues())
        portfolio = list(ib.portfolio())

        positions = []
        quotes = []
        setups = []
        account_id = ""

        for item in portfolio:
            contract = item.contract
            symbol = str(
                getattr(contract, "symbol", "")
                or getattr(contract, "localSymbol", "")
            )
            if not account_id:
                account_id = str(getattr(item, "account", "") or "")

            quantity = finite(item.position, 0) or 0
            market_price = finite(item.marketPrice, 0) or 0
            market_value = finite(item.marketValue, 0) or 0
            average_cost = finite(item.averageCost, 0) or 0
            unrealized = finite(item.unrealizedPNL, 0) or 0
            realized = finite(item.realizedPNL, 0) or 0

            positions.append(
                {
                    "contract": {
                        "symbol": symbol,
                        "secType": str(getattr(contract, "secType", "")),
                        "currency": str(getattr(contract, "currency", "USD")),
                        "exchange": str(
                            getattr(contract, "exchange", "")
                            or getattr(contract, "primaryExchange", "")
                        ),
                        "conId": int(getattr(contract, "conId", 0) or 0),
                    },
                    "quantity": quantity,
                    "marketPrice": market_price,
                    "marketValue": market_value,
                    "averageCost": average_cost,
                    "unrealizedPnl": unrealized,
                    "realizedPnl": realized,
                }
            )
            quotes.append(
                {
                    "symbol": symbol,
                    "last": market_price,
                    "bid": None,
                    "ask": None,
                    "close": market_price,
                    "source": "IBKR PORTFOLIO",
                }
            )
            setups.append(
                {
                    "symbol": symbol,
                    "status": "LIVE",
                    "signal": "HOLD",
                    "reason": "Verified open IBKR position.",
                    "hasPosition": True,
                    "positionQty": quantity,
                    "close": market_price,
                    "plannedQty": 0,
                    "plannedValue": 0,
                    "maxPlannedLoss": 0,
                    "commissionBuffer": 0,
                    "chart": [],
                }
            )

        held = {position["contract"]["symbol"] for position in positions}
        for symbol in ("QQQM", "SMH"):
            if symbol not in held:
                setups.append(
                    {
                        "symbol": symbol,
                        "status": "NOT_HELD",
                        "signal": "NO_TRADE",
                        "reason": "No open IBKR position.",
                        "chart": [],
                    }
                )

        net_liquidation = tag_value(rows, "NetLiquidation")
        total_cash = tag_value(rows, "TotalCashValue")
        settled_cash = tag_value(rows, "SettledCash")
        buying_power = tag_value(rows, "BuyingPower")
        available_funds = tag_value(rows, "AvailableFunds")
        excess_liquidity = tag_value(rows, "ExcessLiquidity")
        gross_position_value = tag_value(rows, "GrossPositionValue")
        init_margin = tag_value(rows, "InitMarginReq")
        maint_margin = tag_value(rows, "MaintMarginReq")
        unrealized_pnl = tag_value(rows, "UnrealizedPnL")
        realized_pnl = tag_value(rows, "RealizedPnL")
        leverage = tag_value(rows, "Leverage-S")

        if settled_cash is None:
            settled_cash = total_cash
        cash_percent = (
            ((total_cash or 0) / net_liquidation * 100)
            if net_liquidation
            else None
        )

        return {
            "version": "3.0",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "mode": "READ_ONLY",
            "gateway": {
                "connected": True,
                "host": IB_HOST,
                "port": IB_PORT,
                "reason": None,
            },
            "account": {
                "account": account_id,
                "netLiquidation": net_liquidation,
                "totalCash": total_cash,
                "settledCash": settled_cash,
                "buyingPower": buying_power,
                "availableFunds": available_funds,
                "excessLiquidity": excess_liquidity,
                "grossPositionValue": gross_position_value,
                "initMarginReq": init_margin,
                "maintMarginReq": maint_margin,
                "dayTradesRemaining": None,
                "leverage": leverage,
                "unrealizedPnl": unrealized_pnl,
                "realizedPnl": realized_pnl,
                "cashPercent": cash_percent,
            },
            "positions": positions,
            "quotes": quotes,
            "strategy": {
                "name": "ANEVUM HOLDINGS MONITOR",
                "timeframe": "LIVE",
                "rules": {
                    "trend": "Read-only holdings telemetry",
                    "entry": "Informational only",
                    "exit": "Informational only",
                    "stop": "No automated orders",
                    "universe": [setup["symbol"] for setup in setups],
                    "positionBudgetUsd": 0,
                    "maxPlannedLossUsd": 0,
                    "commissionBufferUsd": 0,
                },
                "setups": setups,
            },
            "persistence": {
                "equityHistory": "not_persisted",
                "reason": "COMMAND displays verified current IBKR state only.",
            },
        }
    except Exception as exc:
        return offline_snapshot(f"{type(exc).__name__}: {exc}")
    finally:
        try:
            ib.disconnect()
        except Exception:
            pass
        loop.close()


def cached_snapshot():
    now = time.time()
    if _cache["value"] is not None and now - _cache["at"] < CACHE_TTL:
        return _cache["value"]

    with _cache_lock:
        now = time.time()
        if _cache["value"] is not None and now - _cache["at"] < CACHE_TTL:
            return _cache["value"]
        value = build_snapshot()
        _cache["value"] = value
        _cache["at"] = time.time()
        return value


@app.get("/")
@app.get("/health")
async def health():
    return {
        "ok": True,
        "service": "anevum-finance-telemetry",
        "version": "3.0",
    }


@app.get("/v1/finance/snapshot")
async def finance_snapshot(authorization: str | None = Header(default=None)):
    await require_command_admin(authorization)
    return await asyncio.to_thread(cached_snapshot)


register_alpaca(app, require_command_admin)
