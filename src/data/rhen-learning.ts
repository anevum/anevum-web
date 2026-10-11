/**
 * RHEN Open R2: first-party, free educational curriculum.
 * This static material never reads accounts, queries market data or initiates trades.
 * Version/review dates describe editorial source review, not measured performance.
 */
export type LearningSource = Readonly<{name:string;url:string;context:string}>;
export type LearningExample = Readonly<{title:string;steps:readonly string[];conclusion:string}>;
export type LearningSection = Readonly<{
  heading:string; paragraphs:readonly string[]; points?:readonly string[]; example?:LearningExample;
}>;
export type LearningQuestion = Readonly<{question:string;answer:string;explanation:string}>;
export type RhenLesson = Readonly<{
  slug:string;number:number;title:string;summary:string;version:string;reviewedOn:string;
  estimatedMinutes:number;outcomes:readonly string[];sections:readonly LearningSection[];
  glossary:readonly {term:string;definition:string}[];
  check:readonly LearningQuestion[];sources:readonly LearningSource[];
}>;
export const rhenLessons:ReadonlyArray<RhenLesson> = [
  {
    slug:"market-orders-and-quotes",
    number:1,
    title:"How orders meet a market",
    summary:"Understand bids, offers, spreads, market and limit orders, stops, and why a quoted price is not a guaranteed fill.",
    version:"1.0.0",reviewedOn:"2026-10-11",estimatedMinutes:9,
    outcomes:[
      "Explain the difference between a last trade, a bid, and an ask.",
      "Identify the price-versus-execution trade-off of market, limit, and stop orders.",
      "Estimate a spread cost using explicitly hypothetical quotes."
    ],
    sections:[
      {
        heading:"Start with the quote, not the chart",
        paragraphs:[
          "A chart usually displays completed trades. It is not a queue of executable offers at that same price. A quote contains a bid—the price someone currently offers to pay—and an ask or offer—the price someone currently asks to receive. The displayed best bid and ask can change before an order arrives. The difference is the quoted spread.",
          "An order is an instruction with size, side, price conditions and often time restrictions. A trade happens only if it can interact with available opposing interest under the broker and venue rules. The last reported trade is historical even if it happened a fraction of a second ago.",
          "An automated strategy needs to know which information existed when it decided, when its order arrived, which quantity actually filled, and which price applied. A single candle close cannot establish all four facts."
        ],
        example:{
          title:"Quote and spread (illustrative, not live data)",
          steps:[
            "Best bid: $49.95 per share. Best ask: $50.05 per share. Quoted spread: $0.10 per share.",
            "If 20 shares can be bought at $50.05, the notional purchase is 20 × $50.05 = $1,001.00.",
            "If those 20 shares could immediately be sold at $49.95, the gross proceeds would be $999.00."
          ],
          conclusion:"The immediate round-trip difference is −$2.00 before any extra fees, market movement, or slippage. The example assumes sufficient quoted quantity at both prices; actual fills are not guaranteed."
        }
      },
      {
        heading:"What different order instructions do",
        paragraphs:[
          "A market order requests a prompt buy or sell against available liquidity. It prioritizes execution, not a fixed price. A thin market, a fast move, or a large order can produce a different price from the last trade or the quote you saw.",
          "A buy limit order sets the most you will pay; a sell limit sets the least you will accept. A limit protects the price condition, but the order can remain unfilled or partly filled. Price touching your limit is not proof that your order was reached in the queue.",
          "A stop order waits for its trigger and then generally becomes a market order. The trigger is not a guaranteed exit price. A stop-limit order becomes a limit order when triggered; it can fail to execute during a sharp move. A protective order is a rule for trying to exit, not insurance against gaps, halts or outages."
        ],
        points:[
          "Market: potentially faster execution, uncertain price.",
          "Limit: price boundary, uncertain execution or quantity.",
          "Stop: trigger condition followed by a market order, uncertain fill price.",
          "Stop-limit: trigger plus price boundary, potentially no exit.",
          "Day, good-til-canceled and extended-hours eligibility depend on the broker and order instructions."
        ],
        example:{
          title:"A price limit is not a promise",
          steps:[
            "Suppose the ask is $50.05 and you submit a buy limit for 20 shares at $50.02.",
            "The broker can execute at $50.02 or lower when eligible liquidity appears; it cannot simply fill at $50.05 without violating your buy limit.",
            "If no eligible seller matches your order, your position remains zero. Even if a chart prints $50.02, the displayed trade need not have been available to your order."
          ],
          conclusion:"A hypothetical backtest that simply assumes every touched limit fills will tend to overstate execution quality."
        }
      },
      {
        heading:"Time, liquidity and extended hours",
        paragraphs:[
          "A U.S. exchange session is not one uniform liquidity pool. Outside regular hours, participation, displayed depth, eligible order types and price behavior can differ. A broker may accept extended-hours limits but reject market orders, or apply separate time-in-force rules.",
          "Large spreads and partial fills matter more to small-margin strategies than many indicators do. If a trade targets a few cents, a few cents of unmodeled cost can reverse its apparent result. Never infer an executable quote from an old bar or a public display marked delayed.",
          "Before any real order: confirm your broker's permitted session, available buying power, the exact order type, and how cancellations and partial fills appear. A request accepted by an API is not the same thing as an executed trade."
        ]
      },
      {
        heading:"Read execution evidence carefully",
        paragraphs:[
          "Useful records distinguish an observation timestamp, a decision timestamp, an order submission, broker acknowledgement, fill events, cancellations and reconciliation. They also preserve symbol, share quantity, environment (historical, paper or live), order instructions and applicable costs.",
          "Historical replay models fills using past information; it does not send a broker order. Paper trading sends simulated orders to a paper environment, which may behave differently from the live market. Live execution exposes real capital and depends on independent brokerage authorization and controls.",
          "RHEN's V5 educational pages do not place orders or imply any member trading capability is active. This lesson can be completed for free, anonymously and without connecting a broker."
        ]
      }
    ],
    glossary:[
      {term:"Bid",definition:"Price a buyer currently offers for a specified quantity."},
      {term:"Ask",definition:"Price a seller currently requests for a specified quantity."},
      {term:"Spread",definition:"Ask minus bid; a quoted measure, not an all-in trading fee."},
      {term:"Slippage",definition:"Difference between an assumed or reference price and actual execution."},
      {term:"Partial fill",definition:"Only part of an order's requested quantity executes."},
      {term:"Time in force",definition:"Instruction defining how long an unfilled order remains eligible."}
    ],
    check:[
      {question:"The last reported trade was $50.00 and the best ask is $50.08. Does a market buy guarantee a $50.00 fill?",answer:"No.",explanation:"A last trade is not an executable offer. A market order uses available liquidity when it reaches the market; its price can be higher or lower than an earlier display."},
      {question:"A buy limit at $50.02 never fills, even though the chart touches $50.02. Is that necessarily an error?",answer:"No.",explanation:"Touching a price does not establish the quantity or queue priority available to your order. The limit controls price, not a fill guarantee."},
      {question:"Does a stop-loss at $49.00 guarantee an exit at $49.00?",answer:"No.",explanation:"A stop can trigger a market order that fills elsewhere, or may be affected by a trading halt, gap, or brokerage handling."}
    ],
    sources:[
      {name:"SEC Investor.gov — Understanding Order Types",url:"https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14",context:"Market, limit, stop and timing instructions; updated August 18, 2026."},
      {name:"SEC Investor.gov — Types of Orders",url:"https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders",context:"Plain-language distinction between execution and price conditions."},
      {name:"SEC Investor.gov — Online Investing",url:"https://www.investor.gov/introduction-investing/getting-started/investing-your-own/online-investing",context:"Confirm orders and cancellations, understand your broker and set price limits."}
    ]
  },
  {
    slug:"risk-math-and-strategy-evidence",
    number:2,
    title:"Risk math and strategy evidence",
    summary:"Test a trading claim after costs, identify weak backtests, and separate historical, paper, and real-money evidence.",
    version:"1.0.0",reviewedOn:"2026-10-11",estimatedMinutes:11,
    outcomes:[
      "Compute a simple expected result after wins, losses and explicit costs.",
      "Recognize selection bias, look-ahead bias and overfitting in strategy tests.",
      "Design a falsifiable, non-executing research test with a held-out period."
    ],
    sections:[
      {
        heading:"State a claim that could be wrong",
        paragraphs:[
          "A trading rule is a hypothesis, not evidence of profit. A useful hypothesis defines an instrument universe, exact decision time, information available then, entry, exit, position size, fees, and a circumstance in which the idea would count as a failure. The question is whether the rule survives an independent test—not whether a chart can be made to look persuasive.",
          "Choose a baseline before testing. For example, compare a signal with doing nothing and with a simple, predeclared alternative. Avoid searching hundreds of parameter choices and describing the strongest one as if it were selected before looking at the data."
        ],
        points:[
          "Record the proposed rule and a reason it might work.",
          "Identify a data source and its timestamp/coverage limits.",
          "Freeze the test period, exclusions and transaction-cost assumptions.",
          "Define pass and fail criteria in advance, including a negative result."
        ]
      },
      {
        heading:"Start with expectancy, not win rate",
        paragraphs:[
          "A strategy can win more often than it loses and still lose money. If losses are larger than wins, the average outcome can be negative. Expected value is the probability-weighted average of outcomes minus the costs of taking the trade.",
          "Use a fixed, consistently defined unit—for example dollars per complete round trip or dollars per share. Do not compare a gross percentage with fees in dollars without converting both to the same unit. Estimates are not guarantees, and the sample average can change substantially with more data."
        ],
        example:{
          title:"A 55% win rate that still loses money (synthetic numbers)",
          steps:[
            "Assume a 55% win probability with an average gross gain of $0.80 on winning trades.",
            "Assume a 45% loss probability with an average gross loss of $1.00 on losing trades.",
            "Assume a round-trip cost of $0.12 per trade, including estimated spread, slippage and fees.",
            "Expected net outcome = (0.55 × $0.80) − (0.45 × $1.00) − $0.12 = −$0.13 per trade."
          ],
          conclusion:"Even under these simplifying assumptions, the expected result is negative despite winning more than half the time. Real fills and costs may make the result worse."
        }
      },
      {
        heading:"Costs can erase a tiny paper edge",
        paragraphs:[
          "A backtest that buys at each candle close and sells at a later close often ignores whether either price was actually executable. Quote spreads, partial fills, slippage, venue fees, market impact and borrow or financing expenses, when relevant, belong in the model. Fee schedules and liquidity vary by account and broker; they must be checked for the specific test rather than copied from another person's screenshot.",
          "Suppose the gross hypothetical gain on a $1,000 position is 0.12%, or $1.20. If the same round trip incurs $0.40 of spread cost, $0.60 of slippage and $0.25 of other fees, net result is $1.20 − $0.40 − $0.60 − $0.25 = −$0.05. This arithmetic is illustrative, not a claim about a current broker or RHEN result."
        ]
      },
      {
        heading:"Understand what each test can prove",
        paragraphs:[
          "Historical backtesting runs a rule against recorded past data, possibly with a simulated execution model. It can reject bad hypotheses cheaply, but it is hypothetical performance. Paper trading can exercise scheduling, APIs, account isolation and the order lifecycle in a simulated brokerage environment. Neither proves an edge will survive real spreads, outages, changing competition or live order execution.",
          "Live results are real economic outcomes after costs, but a few trades cannot reliably distinguish skill, luck or a favorable market regime. Keep separate labels for historical replay, paper activity, and live outcomes; never blend their equity lines or describe paper orders as real fills.",
          "An SEC investor bulletin cautions that back-tested performance is hypothetical and that selectively showing favorable periods distorts a track record. Honest research publishes failures and limitations alongside successes."
        ],
        points:[
          "Look-ahead: the rule sees information that would not yet exist at decision time.",
          "Selection or survivorship bias: failed or delisted instruments disappear from the historical sample.",
          "Overfitting: many thresholds are chosen to match noise in the observed sample.",
          "Data leakage: revisions, future bars or later labels enter the earlier feature calculation.",
          "Regime dependence: a rule works only during a particular market condition.",
          "Execution mismatch: modeled fills require impossible timing or unavailable quotes."
        ]
      },
      {
        heading:"Reserve a holdout, then try to disprove the idea",
        paragraphs:[
          "Split data chronologically. Develop the rule on one period, select limited parameters on a later validation period, and preserve a final unseen holdout. Repeatedly peeking at the holdout effectively turns it into more training data. If a hypothesis fails, record that result; do not silently retune until the holdout improves.",
          "For a time-dependent system, also test missing observations, market halts, stale quotes, order cancellation, position reconciliation, and the cost of being unable to exit. Any proposed live promotion needs separate authorization. A good research record is reproducible and safe even when the outcome is not profitable."
        ],
        example:{
          title:"A no-money research worksheet",
          steps:[
            "Write: If [observable condition] is present at [timestamp], then [next-period outcome] should differ from [baseline].",
            "Record: source, sampling interval, eligible symbols, missing-data treatment and immutable raw evidence.",
            "Freeze: development, validation and untouched holdout dates, one baseline, one cost model and pass/fail criteria.",
            "Report: candidate count, exclusions, gross and net results, uncertainty, adverse scenarios and rejected variations."
          ],
          conclusion:"This exercise needs no brokerage login, deposit or order. The goal is to learn how evidence can invalidate a claim."
        }
      },
      {
        heading:"Protect capital before thinking about returns",
        paragraphs:[
          "A proposed position size should reflect the amount that can be lost, not just the available buying power. A price stop is not a hard maximum loss: gaps, thin markets, halts and failures can produce worse fills. Margin, leverage, short positions and derivatives introduce additional risks beyond a simple cash purchase; they are not required for this lesson.",
          "FINRA's day-trading risk disclosure warns that frequent trading can produce rapid losses, especially when funds are limited. Money needed for living expenses, housing, education or emergencies should not be put at risk for speculative day trading. Market research is not a substitute for a financial plan or professional advice."
        ]
      }
    ],
    glossary:[
      {term:"Expectancy",definition:"A probability-weighted average result after costs under stated assumptions."},
      {term:"Backtest",definition:"Hypothetical application of a rule to historical observations."},
      {term:"Holdout",definition:"Data reserved from model development for an independent final test."},
      {term:"Look-ahead bias",definition:"Using future information to make a supposedly earlier decision."},
      {term:"Slippage",definition:"Difference between assumed and achieved execution prices."},
      {term:"Drawdown",definition:"Decline from a previous peak in the value of a measured series."}
    ],
    check:[
      {question:"Can a 55% win rate establish a profitable strategy on its own?",answer:"No.",explanation:"The sizes of wins and losses, trading costs, sample uncertainty and time period matter. The worked example has a negative expected result."},
      {question:"You test 300 variations, inspect the same holdout repeatedly, and report the best. Is that still an independent final test?",answer:"No.",explanation:"Repeated selection on the holdout contaminates it. Freeze the rule before the independent evaluation and report the search process."},
      {question:"Does a good paper-trading equity curve prove equivalent future live returns?",answer:"No.",explanation:"Paper execution is simulated and may not capture live liquidity, price impact, failure modes or market changes."},
      {question:"Does placing a stop at a loss threshold set a guaranteed maximum possible loss?",answer:"No.",explanation:"A stop is an execution instruction subject to gaps, halts and liquidity; the fill price is not guaranteed."}
    ],
    sources:[
      {name:"SEC Investor.gov — Investor Bulletin: Performance Claims",url:"https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-47",context:"Backtesting, hypothetical projections, past performance and cherry-picked returns."},
      {name:"FINRA Rule 2270 — Day-Trading Risk Disclosure Statement",url:"https://www.finra.org/rules-guidance/rulebooks/finra-rules/2270",context:"Financial risks of speculative short-term trading and the importance of capital protection."},
      {name:"SEC Investor.gov — Understanding Order Types",url:"https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14",context:"Execution risk and differences between market, limit and stop instructions."}
    ]
  }
];
export function rhenLessonBySlug(slug:string):RhenLesson|undefined {
  return rhenLessons.find(lesson=>lesson.slug===slug);
}
