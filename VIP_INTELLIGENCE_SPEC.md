# MEME CHECKER — VIP INTELLIGENCE SPEC

Bàn giao cho backend. Mỗi mục là một module VIP: vấn đề người dùng, dữ liệu cần, cách tính, giới hạn, và file frontend đang render nó.

Nguyên tắc chung áp dụng cho **mọi** module dưới đây:

1. **Không có dữ liệu thì trả `null`, không trả `0`.** `0` là một phép đo, `null` là không có phép đo. UI phân biệt hai thứ này và render `—` / `not measured`.
2. **Mỗi con số phải kèm mẫu số.** `4/7 rug` chứ không phải `57%`. Người đọc phải kiểm tra lại được.
3. **Không suy ra ý định.** Chỉ đếm hành vi đã quan sát. "Ví này bán sau 96 phút" là dữ kiện; "ví này có ý định xả hàng" là cáo buộc.
4. **Nhãn phải mang theo bằng chứng.** `block-0 bundler` chỉ được hiện khi có rows chứng minh, kèm confidence.

---

## P1 — MUST HAVE

### 1. Launch history (nền tảng của mọi thứ khác)

**Vấn đề người dùng.** Sau khi thấy "3 ví bundle giữ 22%", câu hỏi tiếp theo luôn là: *những ví này đã làm gì trước đây?* Không có lịch sử thì cả sản phẩm chỉ là một ảnh chụp.

**Đây là dependency của P1 #2–#6.** Ship trước mọi thứ khác.

**Dữ liệu cần** — một row cho mỗi (launch, wallet):

| Field | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `launch.symbol` | string | ticker | metadata token |
| `launch.mint` | string | địa chỉ | metadata token |
| `launch.at` | ISO date | ngày launch | `pairCreatedAt` |
| `launch.startMc` | number | mcap lúc mở | lấy từ block đầu tiên có trade |
| `launch.peakMc` | number | mcap cao nhất | max qua lịch sử giá |
| `launch.endMc` | number | mcap hiện tại | giá hiện tại × supply |
| `launch.rugged` | boolean | LP rút hoặc mcap < 5% peak | tính từ `endMc / peakMc` |
| `launch.bundlePct` | number | % supply mua ở block 0 | xem module 2 |
| `wallet.addr` | string | địa chỉ ví | |
| `wallet.bought` | number | % supply mua lúc launch | sum các lệnh buy trong block 0 |
| `wallet.sold` | number | % vị thế đã bán | sum sell / bought |
| `wallet.holdMin` | number \| null | phút giữ trước lần bán đầu | timestamp sell đầu − timestamp buy |
| `wallet.entrySec` | number | giây sau khi mở mà ví mua | timestamp buy − timestamp launch |
| `wallet.exitAtPeakFrac` | number \| null | bán ở bao nhiêu % của peak | giá bán / peakMc |

**Cách tính.**

- `rugged`: `endMc / peakMc < 0.05` **hoặc** có sự kiện LP removal. Ghi cả hai cờ, không gộp.
- `holdMin`: nếu không có sell nào → `null`, **không** phải `0`. Đây là bug đã gặp ở bản trước: ví "first sell 0s" nhưng vẫn holding.
- `entrySec`: đo từ timestamp của transaction tạo pool, không phải từ block number.

**Giới hạn cần biết trước.**

- Launchpad (pump.fun, raydium) có thể không trả `pairCreatedAt` chính xác → cần fallback sang block của transaction đầu tiên.
- Ví bán một phần nhiều lần: `holdMin` là lần bán **đầu tiên**, không phải lần cuối.
- Token chết trước khi index xong thì `peakMc` sẽ thấp giả tạo.

**Frontend.** `src/lib/launches.ts` (shape + demo rows), `src/lib/intel.ts` (toàn bộ derivation).

---

### 2. Bundle intelligence — mở rộng

**Vấn đề.** `bundlePct` free đã trả lời "có bundle không". Câu hỏi tiếp: *nhóm này là ai, và họ có thoát cùng nhau không?*

**Free (giữ nguyên).** Số ví, % supply, shared funder có/không, sell synchrony headline, exit window.

**VIP.**

| Feature | Công thức | Field cần |
|---|---|---|
| Wallet DNA mỗi ví | xem module 5 | launch history rows |
| Median / average hold | `median(holdMin)` qua mọi launch của ví | `holdMin` |
| Exit point | `median(exitAtPeakFrac)` | `exitAtPeakFrac` |
| Exit spread nhóm | mỗi launch: `max(holdMin) − min(holdMin)`, rồi median | `holdMin` |
| Exit style | spread ≤15min → `simultaneous`; ≤90min → `staggered`; else `unknown` | |
| Collapses after exit | số launch `rugged` mà nhóm có mặt | `rugged` |
| Peak group supply | max qua các launch của `sum(bought)` | `bought` |

**Ngưỡng đã chọn và lý do.**

- `15 phút` cho "simultaneous": đây là cửa sổ đủ rộng cho jitter RPC, đủ hẹp để một nhóm bán đồng loạt rơi vào.
- `90 phút` cho "staggered": trên mức này thì việc "cùng nhóm" không còn ý nghĩa dự báo.

**Giới hạn.** Spread chỉ đo được khi ≥2 ví trong nhóm đã bán trên cùng một launch. Nếu <2 → `null`.

**Frontend.** `src/components/Intelligence.tsx` → `GroupRead`. `src/components/BundleIntel.tsx` → `BundleDeep`.

---

### 3. Wallet network (co-appearance graph)

**Vấn đề.** "Hai ví này có liên quan không?" — câu hỏi trung tâm của mọi cuộc điều tra memecoin.

**Quyết định thiết kế quan trọng.** Edge ở đây là **co-appearance trên cùng launch**, không phải funding link. Hai thứ này là hai mức bằng chứng khác nhau. Gộp chúng là cách các sản phẩm wallet-graph đi đến chỗ vu khống người ta.

**Dữ liệu cần.** Không cần gì mới ngoài launch history. Nếu có funding trace thì vẽ **edge riêng, nhãn riêng** — không trộn vào graph này.

**Cách tính.**

```
edge(a,b).together = số launch mà cả a và b đều xuất hiện
edge(a,b).alwaysAtLaunch = mọi launch chung đều có entrySec(a) ≤ 2 && entrySec(b) ≤ 2
node.degree = số edge có together ≥ 2 chứa node đó
core = các node có degree ≥ 3
```

**Ngưỡng.** `together ≥ 2` mới vẽ. Một lần gặp chung là trùng hợp; hai lần là một mẫu.

**Giới hạn.**

- Ví của chính deployer luôn xuất hiện → degree cao giả tạo. Cần loại trừ hoặc đánh dấu riêng.
- Ví bot sniper chung một dịch vụ sẽ có edge giả (cùng tool, không cùng người).
- Chỉ phủ được các token đã scan. Coverage phải hiện ra UI, không được giấu.

**Frontend.** `src/components/Intelligence.tsx` → `WalletNetworkView`.

---

### 4. Exit ordering

**Vấn đề.** Bundle không nguy hiểm vì tồn tại; nó nguy hiểm vì **thứ tự rời đi**. Ví rời đầu tiên đặt giá mà mọi người khác thoát vào.

**Dữ liệu cần.** `holdMin`, `exitAtPeakFrac` (đã có ở module 1).

**Cách tính.**

```
trong mỗi launch: sort các ví đã bán theo holdMin tăng dần
position = index + 1
firstOutCount(addr) = số launch mà addr có position == 1
```

**Giới hạn.** Position chỉ tính trong các ví **đã bán**. Ví còn giữ không có position — đừng gán 0 hoặc ∞.

**Frontend.** `src/components/Intelligence.tsx` → `ExitOrderTable`.

---

### 5. Wallet DNA (behaviour classification)

**Vấn đề.** Nhãn "smart money" / "bundler" hiện là do người viết gán. Cần nhãn suy ra từ hành vi, kèm mức tin cậy.

**Cây quyết định** (theo thứ tự, dừng ở nhánh đầu tiên khớp):

| Điều kiện | Nhãn | Confidence |
|---|---|---|
| `launchCount < 2` | `insufficient history` | 0 |
| mọi appearance có `bought == 0` | `insider supply` | 0.85 |
| entry ≤2s trên ≥75% launch **và** bundleCount ≥3 | `block-0 bundler` (100%) / `launch sniper` | `min(0.95, 0.5 + n×0.08)` |
| `medianHoldMin < 60` **và** `medianExitAtPeak < 0.5` | `fast flipper` | 0.7 |
| `medianHoldMin ≥ 240` | `patient holder` | 0.65 |
| còn lại | `mid-curve seller` | 0.55 |

**Vì sao `insufficient history` trả confidence 0.** Một launch không mô tả được mẫu hành vi. UI hiện "treat as a guess" khi confidence < 0.4.

**Giới hạn.**

- Ví đổi chiến lược theo thời gian sẽ bị gán một nhãn duy nhất — sai. Cần tách theo cửa sổ thời gian khi có đủ dữ liệu.
- `bought == 0` có thể do indexer thiếu, không phải do nhận transfer. Phải phân biệt "không mua" với "không thấy lệnh mua".

**Frontend.** `src/lib/intel.ts` → `classifyWallet`. Render: `src/app/wallets/[addr]/page.tsx` panel "Wallet DNA".

---

### 6. Cross-token memory

**Vấn đề.** "Ví này đã xuất hiện ở đâu nữa?" — câu hỏi mà một scanner đơn token không trả lời được.

**Dữ liệu cần.** Launch history, cộng thêm một bảng `scan_history` (token nào người dùng đã scan) nếu muốn nói "6 token bạn đã scan". Chưa có bảng đó thì chỉ nói được "6 launch đã ghi nhận" — đó là những gì UI hiện tại nói.

**Cách tính.** `crossTokenMemory(addr)` = mọi appearance của addr, sort theo ngày.

**Giới hạn.** Không được nói "bạn đã scan" khi chưa có scan history. Đây là ranh giới giữa memory và bịa.

**Frontend.** `src/app/wallets/[addr]/page.tsx` panel "Where else it appears".

---

## P2 — HIGH VALUE (cần thêm data)

### 7. Caller performance từ ví thật

**Vấn đề.** `exitVsCall` hiện là số demo. Con số thật cần map được account X → ví on-chain.

**Dữ liệu cần.**
- `caller.wallet` — địa chỉ ví của account (nguồn: tự công bố, hoặc suy ra từ ví bán đúng thời điểm post)
- `call.timestamp` — thời điểm post, chính xác đến giây
- `call.mcAtPost` — mcap tại thời điểm đó
- `caller.exitPriceAvg` — giá bán bình quân sau post

**Cách tính.** `exitVsCall = exitPriceAvg / priceAtPost`. **> 1.0 nghĩa là họ bán cao hơn giá mà bài post của họ tạo ra.**

**Giới hạn.** Đây là suy luận từ timing, không phải bằng chứng sở hữu ví. UI phải nói rõ.

### 8. Smart follower detection

**Vấn đề.** "Ai mua sau khi KOL post, và họ có phải exit liquidity không?"

**Cần.** Repeat-follower = ví mua trong cửa sổ `[post, post+10min]` trên ≥3 call khác nhau của cùng caller. Đếm được chỉ khi có ≥3 call đã index.

**Ngưỡng.** 10 phút: đủ dài cho phản ứng thật, đủ ngắn để loại người mua tình cờ.

### 9. Narrative history

**Vấn đề.** "Narrative này đã chạy chưa, và chạy mấy lần?"

**Cần.** Bảng `narrative` với `category`, `tokens[]`, và mỗi token có `peakMc`, `hoursToPeak`, `hoursToCollapse`. Cộng embedding hoặc keyword match để gom nhóm.

**Giới hạn.** Gom nhóm narrative bằng text là bài toán mờ. Phải hiện độ tương đồng, không được claim "cùng narrative" như sự thật.

---

## P3 — EXPERIMENTAL

### 10. Funding origin (multi-hop)
Cần trace on-chain thật. Edge phải có transaction hash. Nếu không resolve được hop 2 thì dừng và nói dừng, đừng vẽ tiếp.

### 11. Sybil clustering
Cần fee fingerprint + funding tree. Rủi ro false positive cao. Chỉ nên ship khi có precision đo được.

### 12. Alert on wallet behaviour
Phụ thuộc webhook pipeline. Không phải việc của frontend.

---

## Data contract note cho backend

Frontend hiện đọc từ `src/lib/launches.ts` (static). Khi API sẵn sàng, shape cần trả về giống hệt `LaunchRecord[]`. Không cần sửa component nào — chỉ đổi nguồn.

Nếu field nào thiếu, trả `null`. UI đã xử lý `null` ở mọi chỗ (xem `src/lib/intel.ts`, mọi hàm trả `number | null`).
