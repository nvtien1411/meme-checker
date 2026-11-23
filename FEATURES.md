# MEME CHECKER — PRODUCT SPEC v3
### Website checker + Telegram bot · Free / Pro
Đối tượng: Frontend (tôi) · Backend (sếp) · UI/UX
Nguyên tắc gốc: **chức năng ngang defade.org, giao diện khác hoàn toàn**

---

## 0. Truy cập defade — trạng thái thật

Đã đọc được toàn bộ nội dung: trang chủ, /pricing, /modules, /token/[CA], /kol-leaderboard, /wallet-lookup, /deployer-lookup, /developers
Không xem được giao diện: browser bị chặn IP (`ERR_CONNECTION_RESET`)

Hệ quả: spec này bám theo **chức năng và logic chấm điểm** của defade. Phần nhìn thì mình tự quyết

---

## 1. Điều cốt lõi học được từ defade

**Điểm rủi ro không phải trung bình cộng.** Một phát hiện đủ nặng thì đặt sàn, các module khác không kéo lên được. Đây là lý do defade đáng tin — và mình phải làm y hệt

**Không hiện điểm khi đang chạy.** Check chưa xong thì giữ điểm lại, không flash số đẹp rồi tụt xuống. Người dùng thấy điểm nhảy = mất tin

**Module bị khoá vẫn hiện card.** Free thấy được "có module này, đang khoá", không thấy khoảng trắng. Người dùng luôn biết cái gì chưa được kiểm

**Nguồn fail thì nói fail.** "Không thấy được holder này" — không đoán, không tính là an toàn

**Bộ nhớ tích luỹ.** Mỗi lần scan lưu lại ví. Token sập sau đó thì mọi ví trên token đó bị đánh dấu. Đây là tài sản tăng theo thời gian, không copy được

---

## 2. Bảng đối chiếu 36 module defade

Cột "Mình" ghi rõ giống hay mở rộng. **Giống = chức năng tương đương. Mở rộng = thêm thứ defade không có**

### 2.1. Điểm và khung

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 1 | Red flag score 0–100, có sàn | **Giống** | 5 band, cùng logic sàn |
| 2 | Band: 0–20 / 21–44 / 45–59 / 60–74 / 75–100 | **Giống** | Đổi tên cho dễ đọc hơn |
| 3 | Trạng thái đặc biệt: RUGGED / ABANDONED / NEVER BONDED / NEVER TOOK OFF | **Giống** | |
| 4 | Token header: mint & freeze, LP, launchpad, tuổi | **Giống** | |
| 5 | Contract Safety (EVM) | **Giống** | Chỉ chạy trên EVM, không giả vờ có trên Solana |
| 6 | Launchpad detection (55 launchpad, 9 chain) | **Giống, thu hẹp** | Mình làm 5 chain trước |

### 2.2. Holder và phân bố

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 7 | Holder distribution + top holder | **Giống** | Đã có |
| 8 | Bubble Map (bong bóng + đường nối) | **Giống** | Đã có bản không dây; thêm dây khi có clustering |
| 9 | Connections (ai fund ai, giữ gì bây giờ) | **Giống** | Cần backend trace |
| 10 | Holder Network (bản đồ insider giữa top holder) | **Giống** | |
| 11 | Holder Overlap (ví giữ nhiều token cùng lúc) | **Giống** | |
| 12 | Wallet Overlap | **Giống** | |
| 13 | Holder History (xu hướng số holder, đợt thoát) | **Giống** | |
| 14 | — | **MỞ RỘNG: Holder Decay** | Số holder tăng mà giá giảm = đang chia supply ra ví nhỏ. Defade có holder history nhưng không ghép với giá |

### 2.3. Bundle

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 15 | Bundle Detection (Jito atomic, multi-hop) | **Giống** | Đếm lệnh mua chung slot tạo |
| 16 | Historical Bundles | **Giống** | |
| 17 | — | **MỞ RỘNG: Bundle Hold Time** | Thời gian giữ trung bình trước khi bán lần đầu |
| 18 | — | **MỞ RỘNG: Sell Synchrony** | Bao nhiêu % ví bán trong cùng một slot. Cao = xả nguyên tử, không kịp thoát |
| 19 | — | **MỞ RỘNG: Uniform Buy Ratio** | Bao nhiêu % ví mua số tiền gần giống nhau. Cao = bot, không phải người |
| 20 | — | **MỞ RỘNG: Funded Window** | Các ví được fund trong bao nhiêu phút trước launch. Dưới 10 phút = một người chuẩn bị |
| 21 | — | **MỞ RỘNG: Prior Launch Record** | Nhóm ví này đã vào bao nhiêu launch, bao nhiêu sập |

Đây là chỗ sếp nói "bundle có lịch sử gì, bán ra sao, hold trung bình bao lâu". Defade chỉ có #15 #16. Mình thêm 5 chỉ số

### 2.4. Sniper và insider

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 22 | Sniper detection (đã bán / đã chuyển / còn giữ) | **Giống** | |
| 23 | Insider Network (transfer + funder mapping) | **Giống** | |
| 24 | Fresh Wallet Detection | **Giống** | |
| 25 | Funding Origin (CEX theo tầng KYC) | **Giống** | |
| 26 | Cross-Funding Graph | **Giống** | |
| 27 | Sybil Band Clustering | **Giống** | |
| 28 | Fee Fingerprint (bot dùng chung cấu hình phí) | **Giống** | |
| 29 | Copy Trading Detection | **Giống** | |
| 30 | Signal Fusion (ví bị nhiều module bắt cùng lúc) | **Giống** | Điểm mạnh của defade, phải có |
| 31 | — | **MỞ RỘNG: Insider Profit Pressure** | Ví insider mua giá nào, giá hiện tại bao nhiêu, họ đang lãi bao nhiêu % và có động cơ xả chưa |

### 2.5. Dev

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 32 | Dev Wallet Tracker (còn giữ / đã bán / đã chuyển) | **Giống** | |
| 33 | Deployer Reputation (lịch sử các token trước) | **Giống** | |
| 34 | Launch Operator (ví đứng sau deployer, đã launch gì) | **Giống** | |
| 35 | Deployer Lookup (tra chéo mọi chain) | **Giống** | |

### 2.6. Ví và danh tiếng

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 36 | Wallet Reputation (ví đã xuất hiện trong token nào đã sập) | **Giống** | |
| 37 | Wallet Profiler (win rate, PnL thực) | **Giống** | |
| 38 | Wallet Lookup (trang tra một ví) | **Giống** | |
| 39 | Notable Holders (KOL, trader X, ví có nhãn trong holder) | **Giống** | |
| 40 | Whale Alert (cá voi + mua bán 24h) | **Giống** | |
| 41 | Smart Money Tracker | **Giống** | |
| 42 | Smart Money Signals (ví smart đang mua) | **Giống** | |
| 43 | Terminal (nhận diện bot/terminal, 40+ tên) | **Giống** | |

### 2.7. Thoát hàng

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 44 | Exit Liquidity Calculator (bán được bao nhiêu trước khi trượt giá) | **Giống** | Đã có một phần |
| 45 | Sell Check | **Giống** | |
| 46 | Exit Playbook (launch trước của cùng nhóm ví đỉnh ở đâu, sập sau bao lâu) | **Giống** | |
| 47 | Position Stress Test (vị thế của bạn sau khi insider xả) | **Giống** | Thay cho "lời khuyên đầu tư" |
| 48 | — | **MỞ RỘNG: Exit Window** | Từ lúc ví đầu tiên bán đến lúc giá sập mất bao nhiêu giây. Con số quyết định bạn có kịp thoát không |

### 2.8. Social, KOL, narrative — chỗ mình hơn rõ nhất

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 49 | Social Sentiment Timeline (mention X) | **Giống** | |
| 50 | KOL Leaderboard (xếp hạng theo PnL tuần) | **Giống** | |
| 51 | — | **MỞ RỘNG: KOL 8 chỉ số** | Xem §4. Defade chỉ có bảng PnL, không có hồ sơ uy tín |
| 52 | — | **MỞ RỘNG: Cờ cabal** | Xem §4 |
| 53 | — | **MỞ RỘNG: Smart followers thật** | Số ví smart money copy lệnh, không phải follower count |
| 54 | — | **MỞ RỘNG: Narrative cluster + meta fit** | Defade không có narrative layer nào |
| 55 | — | **MỞ RỘNG: Copy index** | Đây là con thứ mấy của narrative này trong 7 ngày |
| 56 | — | **MỞ RỘNG: Narrative survival** | Narrative này thường sống bao lâu trước khi sập |

**Đây là điểm khác biệt lớn nhất.** Defade mạnh lớp ví, **yếu hẳn lớp social/narrative**. Đó là cửa mình đi vào

### 2.9. Phát hiện và theo dõi

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 57 | Discover (New / Most Traded / Gainers / Losers) | **Giống** | Không làm thành screener — chỉ feed phụ |
| 58 | Rug Feed / Rug Database | **Giống** | |
| 59 | Called It (track record: token bị flag rồi sập) | **Giống** | Thứ tạo niềm tin, phải có |
| 60 | Catches | **Giống** | |
| 61 | Survival (token còn sống bao lâu) | **Giống** | |
| 62 | Heatmap | **Giống** | |
| 63 | Crew Radar (alert khi tay quen launch token mới) | **Giống** | |
| 64 | Watchlist | **Giống** | |
| 65 | Portfolio / Connect Wallet | **Giống** | Giai đoạn sau |
| 66 | — | **MỞ RỘNG: Alert theo hành vi ví** | Không phải alert giá. Alert khi ví bundle hoặc dev di chuyển, kèm giá lúc đó |
| 67 | — | **MỞ RỘNG: Check-again delta** | Bạn check 3 ngày trước ở $40K, giờ $8K. Sản phẩm tự chấm điểm chính nó |

### 2.10. Kênh phân phối

| # | Defade | Mình | Ghi chú |
|---|---|---|---|
| 68 | Web | **Giống** | |
| 69 | Telegram bot (@DeFadeAnalyzerBot) | **Giống** | Như Phanes: dán CA trong group, bot trả lời |
| 70 | Chrome extension | Sau | |
| 71 | iOS / Android | Sau | |
| 72 | REST API | Sau | |
| 73 | MCP connector (Claude/ChatGPT) | Sau | |

---

## 3. Tổng kết khác biệt

**Giống defade (bắt buộc):** 36 module lõi — score có sàn, bundle, sniper, insider, fresh, funding, sybil, dev tracker, deployer reputation, wallet reputation, bubble map, connections, holder network, exit liquidity, stress test, signal fusion, notable holders, whale alert, smart money, terminal, launchpad detection, 4 trang lookup, rug database, called-it

**Mở rộng (bán được tiền):**
1. **Bundle forensics sâu** — hold time, sell synchrony, uniform buy, funded window, prior record
2. **KOL 8 chỉ số + cờ cabal** — không ai làm
3. **Narrative intelligence** — copy index, meta fit, survival, prior instances
4. **Exit window** — từ lúc ví đầu bán đến lúc sập bao nhiêu giây
5. **Alert theo hành vi ví**, không theo giá
6. **Check-again delta** — sản phẩm tự chấm điểm

---

## 4. KOL Intelligence — đặc tả chi tiết

Defade chỉ có bảng xếp hạng PnL. Đây là thứ mình làm khác

### 8 chỉ số, đo được từ on-chain cộng timestamp post

| Chỉ số | Định nghĩa | Đọc thế nào |
|---|---|---|
| `pre_post_run_up` | Token tăng bao nhiêu % trong 3 phút **trước** post | Cao = có người mua trước khi bạn được thông báo |
| `lead_seconds` | Ví KOL mua trước hay sau post bao nhiêu giây | **Âm = call trước khi mua** → không tin kèo của chính mình |
| `post_call_sold_pct` | Bán bao nhiêu % vị thế **sau** khi post | Trên 30% = xả vào người theo |
| `exit_vs_call_price` | Giá bán bình quân chia giá lúc post | **Lớn hơn 1 = bán đúng chỗ follower mua vào** |
| `first_call_hit_rate` | Tỉ lệ chạm 2x, **chỉ lần call đầu** mỗi token | Bỏ repost — repost là farm engagement |
| `repost_ratio` | Post lại token đã call chia tổng post | Cao = đang đẩy token của mình |
| `dead_call_share` | % call không bao giờ chạm 2x | Thước đo thật |
| `smart_followers` | Số ví smart money thật sự copy lệnh | **Không phải follower count** |

### Cờ cabal — bật khi thoả 2 trong 4
1. `lead_seconds` âm
2. `pre_post_run_up` trên 25%
3. `exit_vs_call_price` lớn hơn 1.0
4. Post trùng thời điểm với ví insider của chính token đó

Bật cờ hiện thẳng: *"Người gọi này đã bán ở giá cao hơn giá lúc post"* — nêu sự kiện, không phán xét

### Vì sao bán được
Trong 3.492 call được chấm độc lập, chỉ **9%** còn giá trị cao hơn sau 1 ngày. Trung vị mất 93%. Nói cách khác **91% call là rác**. Sản phẩm đầu tiên nói được điều đó bằng số sẽ thắng

---

## 5. Narrative — đặc tả chi tiết

| Chỉ số | Ý nghĩa |
|---|---|
| `narrative_cluster` | Nhóm nào (animal, AI agent, political, ...) |
| `meta_fit` | Narrative này đang lên hay tàn, so mindshare 7 ngày |
| `prior_instances` | Token cùng narrative đã từng tồn tại, kết quả từng cái |
| `copy_index` | Con thứ mấy của narrative này trong 7 ngày. Thứ 1 là bản gốc, thứ 12 là rác |
| `first_mover` | Có phải bản gốc không |
| `survival_median` | Narrative này thường sống bao lâu trước khi sập |

`copy_index` là chỉ số mạnh nhất — con thứ 12 của narrative đã chết thì không có lý do tồn tại, và điều đó **đo được**

---

## 6. Phân tầng

### Free
Giống defade free (6 module lõi): red flag score, holders, liquidity, lifecycle, **bundle headline**, **sniper headline**
Cộng thêm theo yêu cầu: narrative cơ bản, info dự án, tên KOL đã call

Lưu ý: defade free **có** bundle/sniper headline. Nếu mình bỏ thì free yếu hơn defade — không nên

### Pro — 39 đô/tháng
Toàn bộ 36 module chi tiết + 6 mở rộng + KOL 8 chỉ số + narrative nâng cao + alert hành vi ví + stress test

### Group — 79 đô/tháng
Bot trong group không giới hạn thành viên, alert vào group, leaderboard người call trong group

### Cách tính lượt (học defade)
- 1 lượt = 1 token trên Solana, 3 lượt trên EVM (scan sâu tốn hơn)
- Đã scan token rồi thì 24h xem lại miễn phí
- Free: 3 token/ngày

---

## 7. Màn hình

**Landing** — CA input là trung tâm. Dưới hero là 4 nhóm thay vì 8 check contract: *Ví thế nào · Ai mua trước · Ai đang call · Có gì không khớp*

**Report** — tab: Overview · Ví · Bundle & Sniper · Dev · KOL · Narrative · Bằng chứng
Thứ tự trong Overview: Identity → Verdict → 3 lý do nặng nhất → phân bố holder → teaser Pro

**Wallet lookup** — tra một ví: đã xuất hiện trong token nào, vai trò gì, bao nhiêu token sau đó sập

**Deployer lookup** — tra deployer hoặc bất kỳ token nó launch

**KOL leaderboard** — xếp hạng + bấm vào xem hồ sơ 8 chỉ số

**Rug feed / Called it** — track record công khai. Trang tạo niềm tin

**History** — token đã check + delta từ lúc check đến giờ

**Pricing** — 3 tầng, so sánh theo module

---

## 8. Data contract

Mỗi field: `value` · `source` · `asOf` · `null` nếu không có
`null` render thành `unknown` — không thành 0, không thành pass, không thành cảnh báo

**Free (đủ để bot chạy)**
1. Launch slot + block đầu tiên có giao dịch token
2. Holder + số dư + tổng supply
3. Vai trò holder: thường / LP / burn / bonding curve
4. Địa chỉ dev + % đang giữ
5. `bundle_count`, `bundle_supply_pct` (tổng)
6. `sniper_count`, `sniper_supply_pct` (tổng)
7. Score + danh sách signal kèm weight

**Pro — ví**
8. Mỗi ví bundle: địa chỉ, funder, ngày tạo, số lượng mua
9. `funded_window_min`, `uniform_buy_ratio`
10. Mỗi ví: `first_sell_offset`, `sold_pct`, `avg_sell_price`, `hold_time`
11. `sell_synchrony`, `exit_window_seconds`
12. Nhóm ví → launch trước + kết quả
13. Dev → token đã deploy + kết quả

**Pro — KOL**
14. Post X theo contract/cashtag: tác giả, timestamp, follower
15. Ví KOL + lịch sử mua bán từng token đã call
16. Giá token tại thời điểm post
17. Map ví smart money → ví đang copy

**Pro — narrative**
18. Token theo narrative cluster
19. Mindshare 7 ngày từng narrative

---

## 9. Thứ tự thi công (frontend)

**Đợt 1** — Đổi IA report sang tab. 8 check contract cũ gộp thành module Contract Safety ở cuối. Không cần data mới — làm được ngay

**Đợt 2** — Khuôn cho Bundle / Sniper / Insider / Fresh / Dev với con số tổng. Chưa có data thì `unknown`

**Đợt 3** — Khuôn Pro: mỗi module khoá hiện card + mô tả đúng cái nó sẽ hiện

**Đợt 4** — KOL panel 8 chỉ số + narrative panel

**Đợt 5** — Wallet lookup, Deployer lookup, Rug feed, Called-it

**Đợt 6** — Bot Telegram (chỉ cần 6 field free là chạy, làm song song được từ đợt 2)
