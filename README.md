# changtrixget-tour 🔥

เว็บรวม **ทัวร์ไฟไหม้ / โปรไฟไหม้** (ทัวร์ลดราคาใกล้วันเดินทาง) จากหลายเอเจนซีทัวร์ไทยไว้ที่เดียว — ดีไซน์และฟังก์ชันแนวเดียวกับเว็บรวมดีลทัวร์ไฟไหม้ทั่วไป แต่เป็นแบรนด์ของคุณเอง

โครงสร้าง: **frontend หน้าเดียว** (ค้นหา + ตัวกรอง + มุมมอง รายการ/ปฏิทิน/แผนที่) ทำงานบน **backend aggregator** (Node ล้วน ไม่ต้องลง npm) ที่ดึงดีลจากเว็บต้นทาง แปลงเป็นรูปแบบเดียวกัน แล้วเสิร์ฟผ่าน `/api/deals`

---

## รันเครื่องตัวเอง

ต้องมี Node.js **เวอร์ชัน 18 ขึ้นไป** (ทดสอบบน v22)

```bash
cd changtrixget-tour
node server.js
# เปิด http://localhost:3000
```

ค่าเริ่มต้นจะเสิร์ฟ **ข้อมูลตัวอย่าง** (`data/sample-deals.json`) เพื่อให้เว็บไม่ว่างแม้ยังไม่ได้ต่อข้อมูลจริง

### เปิดโหมดดึงข้อมูลจริง (real-time)

```bash
LIVE=1 node server.js
```

- `LIVE=1` สั่งให้ดึงดีลสดจาก connectors ตอนบูตและทุก ๆ 15 นาที
- ถ้าดึงไม่สำเร็จ (เน็ตล่ม / เว็บต้นทางเปลี่ยนโครงสร้าง) จะ **ถอยกลับไปใช้ข้อมูลตัวอย่างอัตโนมัติ** — เว็บไม่พัง

ตัวแปรแวดล้อมที่ปรับได้:

| ตัวแปร | ค่าเริ่มต้น | ความหมาย |
|---|---|---|
| `PORT` | `3000` | พอร์ตที่รัน |
| `LIVE` | (ปิด) | `1` = ดึงข้อมูลจริง |
| `REFRESH_MS` | `900000` | ความถี่รีเฟรช (มิลลิวินาที) |

---

## ⚠️ เรื่องที่ต้องเข้าใจเกี่ยวกับ "real-time"

การรวมดีลแบบเรียลไทม์ต้องมี **เซิร์ฟเวอร์ที่รันค้างไว้ตลอด** เพื่อดึงข้อมูลจากเว็บต้นทางเป็นรอบ ๆ — ไม่สามารถทำงานจากไฟล์ HTML นิ่ง ๆ บนเครื่องได้ คุณต้องนำโปรเจกต์นี้ไปรันบนโฮสต์ของคุณเอง (ดูหัวข้อ Deploy ด้านล่าง)

นอกจากนี้ connector แต่ละตัว **อ่านโครงสร้าง HTML ของเว็บต้นทาง** ซึ่งเว็บเหล่านั้นอาจเปลี่ยนเมื่อไหร่ก็ได้ ถ้าเปลี่ยนแล้ว parser จะคืนค่าว่าง (`[]`) และระบบจะถอยไปใช้ข้อมูลล่าสุด/ตัวอย่างแทน — ควรตรวจสอบและอัปเดต regex ใน `connectors/*.js` เป็นระยะ และเคารพ robots.txt / เงื่อนไขการใช้งานของเว็บต้นทางเสมอ

---

## แหล่งข้อมูล (connectors) และประเทศที่แสดง

แสดงเฉพาะ 6 ปลายทางนี้เท่านั้น (allowlist บังคับที่ฝั่งเซิร์ฟเวอร์ใน `lib/normalize.js` → `ALLOWED_COUNTRIES`): **จีน · ไต้หวัน · ฮ่องกง · เกาหลี · ญี่ปุ่น · เวียดนาม** — ดีลประเทศอื่นจะถูกตัดทิ้งอัตโนมัติ

| Connector | แหล่ง | สถานะ |
|---|---|---|
| `tourkrub` | tourkrub.co | ✅ parser จริง (ยืนยันโครงสร้างแล้ว) |
| `unithai` | unithaitravel.com | 🟡 เริ่มต้น (อิงจากรูปแบบ URL รูปภาพ) |
| `nidnoi` | nidnoitravel.com | 🟡 สแคฟโฟลด์ (หน้าเป็น JS-rendered ต้องยืนยัน) |
| `travelzeed` | travelzeed.com/fire | 🟡 สแคฟโฟลด์ |
| `thaifly` | thaifly.com/service/hot-deal | 🟡 สแคฟโฟลด์ |
| `mushroom` | mushroomtravel.com/tour/promotion | 🟡 สแคฟโฟลด์ |
| `thaitravelcenter` | thaitravelcenter.com/tour/discounted | 🟡 สแคฟโฟลด์ |
| `besttour` | besttourholidays.com/promotion/hot-deal | 🟡 สแคฟโฟลด์ |

> 🟡 **สแคฟโฟลด์** = URL หน้าโปรไฟไหม้ถูกต้องแล้ว แต่ regex สำหรับลิงก์/รหัส/รูปเป็นค่าเริ่มต้นที่ต้องยืนยันกับ HTML จริงของแต่ละเว็บ (บางเว็บ render ด้วย JS อาจคืน 0 รายการในรอบแรกแล้วถอยไปใช้ข้อมูลตัวอย่าง) แก้ค่าได้ที่ `connectors/sources.js` วิธีตรวจ: `curl -A '<UA>' '<listUrl>' | grep -o '<pattern>'` — และโปรดเคารพ robots.txt / เงื่อนไขการใช้งานของเว็บต้นทางเสมอ

## โครงสร้างโปรเจกต์

```
changtrixget-tour/
├─ server.js              # HTTP server + cache + รีเฟรชอัตโนมัติ (ไม่มี dependency)
├─ connectors/
│  ├─ index.js            # รวม connector + ดึงทุกแหล่งพร้อมกัน + normalize
│  ├─ tourkrub.js         # connector จริง (parse จาก tourkrub.co)
│  ├─ unithai.js          # connector เริ่มต้น (unithaitravel.com)
│  └─ sources.js          # คอนฟิก connector อีก 6 แหล่ง (nidnoi, travelzeed, ฯลฯ)
├─ lib/
│  ├─ normalize.js        # schema กลาง, allowlist ประเทศ, ธง, พิกัดเมือง, ดีดูป
│  └─ scrape.js           # เฟรมเวิร์ก parse การ์ดดีลที่ใช้ร่วมกัน
├─ data/
│  └─ sample-deals.json   # ข้อมูลตัวอย่าง (fallback ออฟไลน์)
└─ public/
   └─ index.html          # ทั้งเว็บอยู่ในไฟล์เดียว (CSS+JS embed)
```

## รูปแบบข้อมูลกลาง (deal schema)

ทุก connector ต้องคืน object หน้าตาแบบนี้:

```js
{
  id, source, sourceName, title,
  country, city, airline,
  durationDays, departDate /* YYYY-MM-DD */, returnDate,
  priceOriginal, priceSale, discountPct,
  image, url, currency
}
```

## เพิ่มแหล่งข้อมูลใหม่

1. สร้างไฟล์ `connectors/<ชื่อ>.js` ที่ export ค่าเริ่มต้นเป็น
   `{ id, name, fetch(opts) -> Promise<deal[]> }`
2. import เข้าใน `connectors/index.js` แล้วเพิ่มลงอาเรย์ `CONNECTORS`
3. ใส่พิกัดเมืองใหม่ (ถ้ามี) ใน `lib/normalize.js` → `CITY_COORDS` เพื่อให้ขึ้นบนแผนที่

> เคล็ดลับ: ถ้าเว็บต้นทางเป็น Next.js มักมี JSON ใน `__NEXT_DATA__` หรือ API ภายใน
> ใช้ค่านั้นจะเสถียรกว่าการ parse HTML

## เปลี่ยนแบรนด์ / สี

ทุกสีและสไตล์อยู่ที่ตัวแปร CSS ด้านบนสุดของ `public/index.html` (บล็อก `:root`)
แก้ `--brand`, `--brand-2`, `--bg`, ฯลฯ แล้วทั้งเว็บเปลี่ยนตาม — ส่งตัวอย่างแบรนด์มาได้ เดี๋ยวปรับให้ตรง

## Deploy (เลือกอย่างใดอย่างหนึ่ง)

- **VPS / เซิร์ฟเวอร์ของคุณเอง:** `pm2 start server.js --name changtrixget` แล้วตั้ง reverse proxy (nginx) ชี้มาที่พอร์ต พร้อม `LIVE=1`
- **Render / Railway / Fly.io:** ตั้ง start command เป็น `node server.js` และ env `LIVE=1`
- **Docker:** ใช้ base image `node:20-alpine`, `CMD ["node","server.js"]`

---

*changtrixget-tour เป็นเว็บรวมดีล ไม่ใช่ผู้ให้บริการทัวร์โดยตรง ราคาและที่นั่งอาจเปลี่ยนแปลง โปรดตรวจสอบกับผู้ขายก่อนจอง*
