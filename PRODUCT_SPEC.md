# MEME CHECKER — PRODUCT SPEC & TECH HANDOFF

Bản này là hợp đồng giữa product (tôi) và tech (sếp). Mỗi mục ghi rõ: cái gì đang có, cái gì cần build, cái gì chưa chắc.

Trạng thái mỗi dòng:
- **[LIVE]** — đã chạy trên production bằng data thật (DexScreener/GeckoTerminal/RugCheck/GoPlus/Solana RPC)
- **[DEMO]** — UI thật, data viết tay. Có nhãn DEMO trên chính con số
- **[NEW]** — UI tôi vừa build, cần sếp nối data
- **[NEED]** — cần data mới, chưa có nguồn
- **[ASK]** — cần sếp xác nhận khả thi

---

## 1. COMPETITOR MATRIX

| Competitor | Workflow chính | Mạnh ở đâu | UX pattern học được | Meme Checker nên lấy gì | KHÔNG nên lấy |
|---|---|---|---|---|---|
| **DEFADE** | Paste CA → 36 module forensic | Bundle/sniper/insider detection sâu; dev history; funding origin nhiều hop | Score 0–100 + evidence từng dòng; "flagged then it fell" social proof | Cấu trúc 36 module, cách trình bày evidence | Bố cục, branding, màu |
| **GMGN** | Trade terminal + copy trade | Holder structure 4 chỉ số (insider %, bundle %, dev %, top10); real-time alerts | Bảng dày, sort nhanh, mọi thứ 1 click | Tốc độ scan bảng, filter preset | Giao diện trading (mình không phải sàn) |
| **Axiom** | Snipe + trade | Tốc độ, ít ma sát | Không có gì để học — landing rỗng khi không login | — | Toàn bộ |
| **Photon** | Snipe | Audit nhanh trước khi mua | "Audit results + txn speed" là 1 khối | Đặt audit ngay trước hành động | — |
| **BullX** | Snipe | Onboarding tối giản | — | — | — |
| **DexScreener** | Discovery | 150k pairs, mọi chain, filter cực mạnh | Bảng + filter bar + multi-timeframe | Table layout, filter chip, cột 5M/1H/6H/24H | Ads, quá nhiều cột |
| **Birdeye** | Data terminal | Smart money flow, exit liquidity endpoint | — | Exit liquidity như 1 khái niệm riêng | Landing marketing |
| **GeckoTerminal** | Pool explorer | New pools, OHLCV | Pool-centric view | — | — |
| **Bubblemaps** | Holder graph | Cluster visualization, "Magic Nodes", time travel | Bubble thay vì node tròn; màu theo cluster | Ý tưởng cluster là 1 thực thể, không phải tập node | Bubble layout (mình dùng node+arc) |
| **Nansen** | Smart money | Wallet labels, leaderboard, "what top traders buy" | Leaderboard theo PnL kỳ | Smart money leaderboard | Enterprise pricing model |
| **Arkham** | Entity tracing | "Follow the money, every hop"; case management | Trace nhiều hop, case = 1 phiên điều tra | Trace nhiều hop (Funding Trace) | UI enterprise |
| **Cielo** | Copy trade | Wallet PnL: realized/unrealized, win rate, median hold, trade simulator | Wallet profile cực chi tiết + replay | Median hold, win rate, trade list | Copy trading (mình không execute) |
| **Kolscan** | KOL realtime | Realtime tx feed của top trader; hoàn toàn free | Feed realtime, PnL per trade | Realtime feed là hook giữ chân | Free hoàn toàn → khó monetize |
| **RugCheck** | Solana rug check | Risk report chi tiết, LP/mint/freeze | Report dạng danh sách check có giải thích | Cấu trúc risk finding | — |

### Kết luận research — Meme Checker thiếu gì

1. **Không có discovery thật** — `/discover` dựa trên 5 token demo, không phải feed.
2. **Không có global search** — chỉ paste CA ở homepage.
3. **Không có realtime** — mọi thứ là snapshot.
4. **VIP không nằm trong luồng** — phải bấm "preview pro".
5. **Nav không theo workflow** — 3 group theo *loại dữ liệu*, không theo *câu hỏi người dùng hỏi*.
6. **Không có watchlist/alerts thật** — trang tĩnh.
7. **Không có wallet PnL** — chỉ có behaviour classification.
8. **Không có KOL realtime feed**.

### Điểm khác biệt nên theo đuổi (không copy ai)

DEFADE mạnh về **token-centric forensics**. GMGN mạnh về **trade speed**. Cielo mạnh về **wallet PnL**. Không ai làm tốt việc **nối ba thứ đó thành một phiên điều tra liên tục**: token → ví → deployer → token khác, giữ nguyên context.

Đó là chỗ Meme Checker thắng: **context không bị mất khi đi sâu**.

---

## 2. UX AUDIT — NHỮNG GÌ ĐANG SAI

| Vấn đề | Bằng chứng | Sửa thế nào |
|---|---|---|
| Nav theo loại dữ liệu | TRADE / ON-CHAIN / MY DESK không nói người dùng đang hỏi gì | Đổi sang FIND / CHECK / TRACK / INVESTIGATE / WATCH |
| Không search được | Không có component search nào trong repo | Command palette ⌘K |
| CA input chỉ ở `/` | `ScanInput` chỉ import ở `app/page.tsx` | CA input ở header + mọi trang có bảng token |
| Token detail tách rời | 7 tab trong 1 trang nhưng không link tới wallet/deployer | Tab có link chéo, drawer giữ context |
| VIP phải bấm mới thấy | `ProReveal` gate mặc định đóng | Preview inline, không cần bấm |
| Demo data không rõ | Nhãn DEMO có nhưng nhỏ | Badge rõ hơn + tooltip nguồn |
| Trang tĩnh giả vờ động | `/watchlist`, `/alerts`, `/history` là demo hardcode | Ghi rõ trạng thái, hoặc build storage |
| 5 token demo | `DEMO_TOKENS` có 5 phần tử | Feed thật từ DexScreener |

---

## 3. SITEMAP ĐỀ XUẤT

Giữ 5 nhóm theo câu hỏi. Số route không tăng — chỉ tổ chức lại + thêm trang mới thật sự cần.

```
FIND                          → "Có gì đáng xem?"
├── Pulse            /            [LIVE] scan + moving now
├── New Pairs        /discover    [NEW] tab mới
├── Trending         /discover    [NEW] tab mới
├── Screener         /screener    [NEED] bảng filter đầy đủ
└── Narrative Radar  /narratives  [DEMO]

CHECK                         → "Token này có đáng không?"
└── Token Scan       /              paste CA
    └── /token/[chain]/[address]   12 section (xem §6.1)

TRACK                         → "Ai đang mua / gọi?"
├── Wallet Tracker   /wallets      [DEMO]
├── Smart Money      /smart-followers [DEMO]
├── Alpha Calls      /callers      [DEMO]
├── Caller Board     /callers/leaderboard [NEW]
└── Deployers        /deployers    [DEMO]

INVESTIGATE                   → "Chuyện gì đang xảy ra sau?"
├── Wallet Network   /investigation  [DEMO] ← visual signature
├── Wallet Intel     /wallets/[addr] [DEMO]
├── Deployer Intel   /deployers/[addr] [DEMO]
├── Compare          /compare        [LIVE]
└── Funding Trace    /investigation?mode=funding [NEED]

WATCH                         → "Giữ gì để theo dõi?"
├── Watchlist        /watchlist    [DEMO]
├── Alerts           /alerts       [DEMO]
├── Rug Archive      /rugs         [LIVE]
└── Scan History     /history      [DEMO]
```

Lý do không thêm nhiều route mới: mỗi route mới là một trang phải nuôi data. Tôi gộp New Pairs / Trending vào `/discover` bằng tab, và Caller Board vào `/callers` bằng tab.

---

## 4. NAVIGATION MỚI

Sidebar 5 nhóm, mỗi nhóm 3–5 item. Giữ icon hiện có.

```
FIND          Pulse · Trending · Screener · Narratives
CHECK         Token Scan
TRACK         Wallet Tracker · Smart Money · Alpha Calls · Deployers
INVESTIGATE   Wallet Network · Compare
WATCH         Watchlist · Alerts · Rug Archive · History
```

So với hiện tại (13 item / 3 group) → 14 item / 5 group. Không dài hơn vì nhóm rõ hơn.

---

## 5. GLOBAL SEARCH — SPEC

Đây là thứ **hoàn toàn mới** và tôi đã build.

### Hành vi
- `⌘K` / `Ctrl+K` mở palette
- Gõ là tìm ngay (debounce 0ms — search local nên không cần)
- `↑` `↓` di chuyển, `Enter` chọn, `Esc` đóng
- Kết quả nhóm theo loại, mỗi loại có icon + màu riêng

### Nguồn dữ liệu

| Loại | Nguồn | Trạng thái |
|---|---|---|
| Token — symbol, name, mint | `DEMO_TOKENS` | [DEMO] |
| Wallet — address | `DEMO_WALLETS` + `walletNetwork().nodes` | [DEMO] |
| Caller — handle, display name | `DEMO_CALLERS` | [DEMO] |
| Deployer — address | `DEMO_WALLETS` filter | [DEMO] |
| Narrative — tên | `DEMO_NARRATIVES` | [DEMO] |

### Việc sếp cần làm
- Endpoint `GET /search?q=` trả 5 loại trên, mỗi loại tối đa 5 kết quả
- Response: `{ tokens: [], wallets: [], callers: [], deployers: [], narratives: [] }`
- Nếu không kịp: frontend chạy trên demo, nhưng phải ghi rõ "demo index" trong palette

### Không làm
- Không search full-text description (chậm, ít giá trị)
- Không search cross-chain nếu chưa có index

---

## 6. FEATURE SPEC — TỪNG MODULE

### 6.1 TOKEN DETAIL — 12 section

**Hiện tại:** 8 tab (Verdict, Holders, Wallets, Callers, Narrative, Exit, Checks, Sources)
**Đề xuất:** giữ 8 tab, thêm nhóm trong tab Wallets

Lý do không làm 12 tab: 12 tab trên mobile là không dùng được, và 3 section đề xuất (Bundle/Sniper/Insider) đã nằm trong tab Wallets.

| # | Section | Tab hiện tại | Free | VIP | Data |
|---|---|---|---|---|---|
| 1 | Overview | Verdict | score, band, findings, identity | — | [LIVE] |
| 2 | Market | Verdict | price, mcap, liq, vol | — | [LIVE] |
| 3 | Holders | Holders | top10, concentration | holder history | [LIVE] top10 / [DEMO] history |
| 4 | Bundle | Wallets | count, %, wallets, timeline | **history, hold time, sell behaviour, funding** | [DEMO] |
| 5 | Snipers | Wallets | count, %, entry timing | **history, repeat wallets** | [DEMO] |
| 6 | Insider | Wallets | early accumulation, concentration | **connections, cross-token** | [DEMO] |
| 7 | Deployer | Wallets → link | address, launch count | **all launches, outcomes, rugs** | [DEMO] |
| 8 | Wallet Network | Wallets → link | graph, direct edges | **historical, cross-token** | [DEMO] |
| 9 | Narrative | Narrative | classification, related tokens | **similar projects, outcomes, saturation** | [DEMO] |
| 10 | Social/KOL | Callers | calls, author, timestamp | **track record, smart followers, pre-call** | [DEMO] |
| 11 | Risk | Checks | 8 checks, evidence | — | [LIVE] |
| 12 | History | — | — | scan history for this token | [NEED] |

### 6.2 BUNDLE INTEL

**Câu hỏi degen hỏi:** "Bọn này đã bundle con nào trước chưa, và chúng nó xả lúc nào?"

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Số ví, % supply, timeline mua, danh sách ví, holding hiện tại | [DEMO] |
| **VIP** | Ví này từng bundle launch nào khác · hold trung bình · ai xả trước · xả kiểu gì (từ từ / sập) · funder chung · nhóm lặp lại · từng tham gia rug nào | [DEMO] |

**Câu upgrade:** "12 ví này đã cùng xuất hiện trong 8 launch trước. Xem chúng thoát lúc nào."

**Data cần:**
```ts
BundleWallet {
  addr: string
  boughtPct: number        // % supply mua
  boughtAtSec: number      // giây sau open
  soldPct: number
  holdMin: number | null   // null = chưa bán
  firstSellAtPeakFrac: number | null
  funder: string | null    // ví rót SOL
  priorLaunches: string[]  // mint của launch khác cùng ví này
  priorOutcomes: ("survived" | "rugged" | "unknown")[]
}
```

**Trạng thái rỗng:**
- Không detect được bundle → "Không phát hiện bundle ở launch block"
- Có bundle nhưng chưa biết history → "12 ví, history chưa có"

**[ASK]** Ví funder lấy từ đâu? Cần trace SOL transfer trước tx mua đầu tiên. Helius có `getSignaturesForAddress` + parse. Sếp xác nhận.

---

### 6.3 SNIPER WATCH

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Số sniper, % mua, thời điểm vào, size | [DEMO] |
| **VIP** | Hiệu suất lịch sử · ví lặp lại · entry timing trung bình · sell timing · chốt lời kiểu gì · overlap giữa token | [DEMO] |

**Định nghĩa sniper (phải nói rõ trên UI):** mua trong **2 giây đầu**, không phải "mua sớm".

**Data:**
```ts
SniperWallet {
  addr: string
  entrySec: number
  boughtPct: number
  soldPct: number
  holdMin: number | null
  repeatCount: number      // số launch khác cũng snipe
}
```

---

### 6.4 INSIDER RADAR

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Accumulation sớm, concentration, label nếu verified | [DEMO] |
| **VIP** | Ví liên quan · quan hệ funding · pattern cross-token · hành vi bán lịch sử · tham gia launch lặp lại | [DEMO] |

**Nguyên tắc bắt buộc:** không gọi ai là insider khi chưa có bằng chứng. UI dùng **"early accumulation"** + % chứ không dùng từ "insider" trừ khi có label verified.

**Data:**
```ts
InsiderSignal {
  addr: string
  confidence: number       // 0-1
  evidence: string[]       // mỗi phần tử là 1 câu đo được
  relatedWallets: string[]
  priorActivity: number    // số launch trước
}
```

---

### 6.5 HOLDER INTELLIGENCE

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Top holders, balance, %, label đã biết, concentration | [LIVE] |
| **VIP** | Lịch sử holder · accumulation/distribution · funder chung · overlap ví · cluster · holding lịch sử · exit pressure của holder lớn | [NEED] |

**Data đã có:** GoPlus trả top holders + concentration.
**Data cần thêm:** historical holder snapshot — cần index theo thời gian. **[ASK]** Sếp có cron snapshot không? Nếu không, VIP phần này để `[NEED]` và UI ghi "cần index lịch sử".

---

### 6.6 WALLET TRACKER

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Holdings hiện tại, trades gần đây, label | [DEMO] |
| **VIP** | Full trading history · win rate · realized PnL · avg hold · entry/exit trung bình · best/worst trade · token đã tham gia · funding source · connected wallets | [NEED] |

**Đây là module thiếu data nặng nhất.** PnL cần giá tại thời điểm mua/bán → cần price history theo phút. DexScreener không trả historical trades.

**[ASK] Nguồn PnL:** Birdeye wallet PnL API (trả phí), Cielo API, hoặc tự tính từ Helius + price oracle. Sếp chọn hướng nào? Cho tới khi có, module này ở `[DEMO]` với nhãn rõ.

---

### 6.7 SMART MONEY

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Wallet đã identify công khai, buying gần đây | [DEMO] |
| **VIP** | Performance lịch sử · độ ổn định · early accumulation · overlap · cluster · vị thế cross-token | [NEED] |

**Nguyên tắc:** không label smart money từ 1 trade lãi. Cần tối thiểu **20 trade** và **win rate > 50%** trong **30 ngày**.

---

### 6.8 ALPHA CALLS (KOL)

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Call công khai trên X · nội dung · author · token · CA · timestamp · giá lúc call · link post | [DEMO] |
| **VIP** | Track record · win rate · ROI · median return · timing accuracy · time-to-peak · pre-call accumulation · smart follower count · follower wallet · caller overlap · cabal signals | [NEED] |

**Data free có thể có thật:** cần scrape X. **[ASK]** Sếp có API X không? Nếu không, phần free vẫn `[DEMO]`.

**Nguyên tắc:** không gọi cabal khi chưa đủ evidence. UI dùng "overlap detected" + số liệu, không dùng từ "cabal".

---

### 6.9 CALLER LEADERBOARD [NEW]

Trang mới `/callers/leaderboard`.

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Danh sách caller + call gần đây + frequency | [DEMO] |
| **VIP** | Rank theo performance · win rate · median ROI · early-call accuracy · smart follower quality · consistency nhiều kỳ | [NEED] |

**Bắt buộc hiển thị:** sample size + khoảng thời gian đo. "56% win trên 8 call" khác hoàn toàn "56% win trên 800 call".

---

### 6.10 SMART FOLLOWERS

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Follower count | [DEMO] |
| **VIP** | Số ví profitable · profile ví · performance · token đã tham gia · early accumulation · overlap · chất lượng follower | [NEED] |

**Định nghĩa (phải hiện trên UI):** smart follower = ví **mua sau khi account post** và **đã có lãi trước đó**. Không phải "follower trên X".

---

### 6.11 NARRATIVE RADAR

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Classification · mô tả ngắn · keyword · token liên quan hiện tại · attention indicator | [DEMO] |
| **VIP** | Project tương tự các cycle trước · ATH lịch sử · sống được bao lâu · saturation · attention trend · smart money positioning · meta fit | [DEMO] |

**Câu upgrade:** "3 project cùng vibe đã launch. Xem chúng lên tới đâu và sống được bao lâu."

**Cảnh báo bắt buộc:** similarity score **không phải** dự đoán giá. UI phải ghi rõ.

---

### 6.12 DEPLOYER TRACKER

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Address · launch history cơ bản · token hiện tại | [DEMO] |
| **VIP** | Tất cả launch trước · outcome · rug history · token survival · nhóm ví lặp lại · funding source · deployer liên quan · tần suất · pattern | [DEMO] |

**Data:** cần index `deployer → tokens`. Có thể lấy từ token metadata (`updateAuthority` / `creator`) qua Helius. **[ASK]**

---

### 6.13 FUNDING TRACE [NEED]

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Funder trực tiếp nếu có | [NEED] |
| **VIP** | Nhiều hop · funder chung · cluster · quan hệ cross-token · mạng lịch sử | [NEED] |

**Đây là feature đắt nhất về data.** Multi-hop trace cần:
1. Với mỗi ví: lấy tx đầu tiên nhận SOL
2. Parse `from` address
3. Lặp lại tới depth N (đề xuất 3)
4. Cache kết quả — trace lại rất tốn

**[ASK]** Sếp muốn làm depth bao nhiêu? 3 hop là đủ thực dụng, 7 hop như Arkham thì cần index riêng.

---

### 6.14 WALLET NETWORK

**Visual signature — giữ nguyên.**

Đã build (`WalletWorkspace.tsx`):
- Node + arc cong + particle chạy dọc path
- Zoom / pan / fit / reset
- Filter theo role
- Path explorer (2 ví → đường đi)
- Cluster focus
- Compare 2 ví
- Inspector panel + 4 tab intelligence

**Free vs VIP:**
| | Nội dung |
|---|---|
| **Free** | Graph, edge trực tiếp, node detail, path 2 ví |
| **VIP** | Historical connections, shared funders, cross-token overlap, cluster expansion, relationship strength |

Hiện cả hai đều `[DEMO]` vì `DEMO_LAUNCHES` là data viết tay.

---

### 6.15 COMPARE

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | 2 token: mcap, liq, vol, holder distribution, risk | [LIVE] |
| **VIP** | Holder overlap · bundle overlap · deployer so sánh · smart money overlap · funding chung · narrative cạnh tranh · outcome lịch sử | [NEED] |

---

### 6.16 DISCOVER / PULSE

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | New pairs · trending · filter cơ bản · metrics | [NEED] |
| **VIP** | Filter nâng cao · smart money activity · deployer pattern · wallet signal · narrative intel · early attention | [NEED] |

**Hiện tại `/discover` render `DEMO_TOKENS` (5 phần tử).** Đây là khoảng trống lớn nhất về sản phẩm — một trang discovery với 5 token demo không dùng được.

**[ASK]** DexScreener có endpoint public:
- `GET /token-profiles/latest/v1` — token mới
- `GET /token-boosts/latest/v1` — boosted
- `GET /latest/dex/search?q=` — search

Trending thật cần `GET /coins/v1/...` (trả phí) hoặc tự tính từ volume/liquidity. Sếp xác nhận dùng hướng nào.

---

### 6.17 RUG ARCHIVE

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Search token bị flag · risk status · record cơ bản | [DEMO] 6 mục |
| **VIP** | Deployer liên quan · ví liên quan · cluster lịch sử · pattern lặp · filter nâng cao | [NEED] |

---

### 6.18 WATCHLIST & ALERTS

| | Nội dung | Trạng thái |
|---|---|---|
| **Free** | Save token · price alert cơ bản | [DEMO] |
| **VIP** | Dev sell · whale dump · smart money · wallet activity · bundle wallet · deployer activity · KOL call · narrative alert · custom rule | [NEED] |

**Hiện tại cả hai trang là static demo.** Không có storage.

**[ASK]** Watchlist lưu ở đâu? localStorage (nhanh, không sync) hay DB (cần auth)? Đây là blocker cho cả module.

---

## 7. FREE VS VIP — NGUYÊN TẮC

**Free trả lời:** câu hỏi **về token này**, ngay lúc này.
**VIP trả lời:** câu hỏi **về người đứng sau**, và **chuyện gì đã xảy ra trước đó**.

Biên giới này thật, không phải gate gắn thêm. Scanner một token không trả lời được "ví này đã làm gì 20 launch trước" vì cần history.

### Bảng tổng hợp

| Module | Free | VIP mở khoá | VIP tăng giá trị vì |
|---|---|---|---|
| Bundle | Thấy bundle | Hành vi + lịch sử ví | Biết trước chúng xả kiểu gì |
| Sniper | Thấy sniper | Hiệu suất lịch sử | Biết đây là bot chuyên nghiệp hay ví mới |
| Insider | Thấy accumulation | Quan hệ + cross-token | Biết có phải cùng 1 nhóm |
| Holder | Top holders | Lịch sử + cluster | Biết ai đang phân phối |
| Wallet | Holdings | PnL + win rate | Biết ví này có thực sự giỏi |
| Smart Money | Danh sách | Performance + cluster | Tránh follow nhầm |
| KOL | Call | Track record + pre-call | Biết caller có ăn thật |
| Narrative | Classification | Project tương tự + outcome | Biết narrative còn sớm hay đã đông |
| Deployer | Address | Toàn bộ launch + rug | Biết dev có tiền sử |
| Funding | Funder trực tiếp | Nhiều hop + cluster | Truy được tiền từ đâu |
| Network | Graph | Historical + cross-token | Thấy nhóm lặp lại |
| Compare | 2 token metrics | Overlap | Biết holder chung |
| Discover | New + trending | Filter nâng cao | Lọc theo smart money |
| Rug DB | Search | Cluster + pattern | Truy nguồn |
| Watchlist | Save | Alert nâng cao | Không bỏ lỡ |

---

## 8. DATA REQUIREMENT MATRIX

| Feature | Data cần | Đã có | Cần build | Cần tính | Chưa chắc |
|---|---|---|---|---|---|
| Token scan | price/liq/vol/mcap | ✅ DexScreener | — | — | — |
| Contract checks | mint/freeze/LP/honeypot | ✅ RugCheck+GoPlus | — | — | — |
| Holder list | top holders + % | ✅ GoPlus | — | concentration | — |
| Holder history | snapshot theo thời gian | — | cron snapshot | delta | ❓ storage |
| Bundle detect | ví mua trong block 0 | — | Helius tx parse | % supply | ❓ |
| Sniper detect | mua < 2s | — | Helius tx parse | — | ❓ |
| Insider | accumulation sớm | — | Helius tx parse | classify | ❓ |
| Deployer history | deployer → tokens | — | index | outcome | ❓ |
| Funding trace | SOL transfer graph | — | Helius + cache | multi-hop | ❓ depth |
| Wallet PnL | giá tại thời điểm mua/bán | — | price history | realized/unrealized | ❓ nguồn |
| Smart money label | ≥20 trade, WR>50%, 30d | — | PnL + rule | label | ❓ |
| KOL calls | X post + token + giá | — | X API | — | ❓ API access |
| Smart followers | ví mua sau post | — | tx + call time | intersect | ❓ |
| Narrative history | project cùng narrative + outcome | — | index | similarity | ❓ |
| Discover feed | token mới + trending | ✅ DexScreener (một phần) | trending ranking | — | ❓ |
| Search | index 5 loại | — | endpoint | — | — |
| Watchlist | lưu token theo user | — | storage | — | ❓ auth |
| Alerts | rule + notify | — | queue + worker | — | ❓ |

---

## 9. CÂU HỎI CẦN SẾP TRẢ LỜI

Xếp theo mức chặn:

**Chặn nhiều module nhất:**
1. **Wallet PnL lấy từ đâu?** (Birdeye paid / Cielo / tự tính) → chặn Wallet Tracker, Smart Money, KOL track record, Caller Leaderboard
2. **X API có không?** → chặn Alpha Calls free tier, Smart Followers, KOL toàn bộ
3. **Watchlist/alerts lưu ở đâu?** (localStorage vs DB + auth) → chặn WATCH group
4. **Có cron/index cho historical không?** → chặn holder history, bundle history, insider cross-token

**Chặn 1–2 module:**
5. Funding trace depth bao nhiêu hop?
6. Deployer → tokens lấy từ đâu (`updateAuthority`? creator field?)
7. Trending ranking tự tính hay mua API?

**Không chặn, nhưng cần biết:**
8. Giá Pro $39 có đúng không?
9. Có giới hạn chain không, hay mở rộng?

---

## 10. IMPLEMENTATION STATUS

### Đã build trong lượt này
- [x] Global search (⌘K palette) — `src/components/CommandPalette.tsx`
- [x] Nav 5 nhóm theo workflow — `Shell.tsx`
- [x] CA input ở header — `Shell.tsx`
- [x] Spec này

### Đã build trước đó (giữ nguyên)
- Wallet Network workspace: zoom/pan/filter/path/cluster/compare — `WalletWorkspace.tsx`
- Bundle/sniper/insider/sell behaviour từ rows — `intel.ts`, `launches.ts`
- Free/VIP tier thật với `ProReveal` — `ui.tsx`
- 18 route chạy

### Chưa làm — và lý do

| Việc | Lý do |
|---|---|
| 12 tab token detail | 8 tab đã cover hết nội dung; 12 tab không dùng được trên mobile |
| Discover feed thật | Cần sếp xác nhận endpoint + cách rank trending |
| Watchlist/alerts thật | Không có storage — build UI sẽ là nút không chức năng |
| Wallet PnL | Không có nguồn giá historical |
| KOL realtime | Không có X API |
| Funding trace | Cần Helius trace + cache, ngoài scope frontend |

Tôi không build UI cho những thứ trên vì brief cấm "non-functional buttons". UI đẹp cho feature không có data là nói dối người dùng.
