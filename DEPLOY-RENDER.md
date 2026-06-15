# ขึ้นออนไลน์ฟรีด้วย Render 🚀

คู่มือนี้พาขึ้นเว็บ ChangTrixGet ทัวร์ไฟไหม้ ฟรี บน Render โดยรันโค้ดเดิมทั้งหมด ไม่ต้องแก้

ใช้เวลาประมาณ 10 นาที สิ่งที่ต้องมี: บัญชี **GitHub** (ฟรี) และบัญชี **Render** (ฟรี — สมัครด้วย GitHub ได้เลย)

---

## ขั้นที่ 1 — เอาโค้ดขึ้น GitHub

ถ้ายังไม่มี Git ในเครื่อง โหลดจาก https://git-scm.com ก่อน แล้วเปิด Terminal ในโฟลเดอร์ `changtrixget-tour`

```bash
cd changtrixget-tour
git init
git add .
git commit -m "ChangTrixGet tour aggregator"
```

จากนั้นสร้าง repo ใหม่บน GitHub (https://github.com/new) ตั้งชื่อเช่น `changtrixget-tour` กด Create แล้วทำตามที่ GitHub บอก:

```bash
git remote add origin https://github.com/<ชื่อคุณ>/changtrixget-tour.git
git branch -M main
git push -u origin main
```

> ไม่อยากใช้คำสั่ง? ใช้ **GitHub Desktop** (https://desktop.github.com) ลากโฟลเดอร์เข้าไปแล้วกด Publish ได้เหมือนกัน

---

## ขั้นที่ 2 — เชื่อม Render กับ repo

1. เข้า https://render.com แล้ว **Sign up with GitHub**
2. กด **New +** (มุมขวาบน) → เลือก **Blueprint**
3. เลือก repo `changtrixget-tour` ที่เพิ่ง push ขึ้นไป
4. Render จะอ่านไฟล์ `render.yaml` ในโปรเจกต์อัตโนมัติ และตั้งค่าให้ทั้งหมด (plan ฟรี, รัน `node server.js`, เปิด LIVE)
5. กด **Apply** / **Create**

รอ Render build สักครู่ (1–2 นาที) เสร็จแล้วจะได้ลิงก์หน้าตาแบบ
`https://changtrixget-tour.onrender.com` — เปิดได้เลย ✅

> ถ้า Render ไม่เจอ `render.yaml` ให้เลือก **New + → Web Service** แทน แล้วตั้งค่าเอง:
> - Build Command: `npm install`
> - Start Command: `node server.js`
> - เพิ่ม Environment Variable: `LIVE` = `1`

---

## ขั้นที่ 3 — อัปเดตเว็บภายหลัง

แก้โค้ดในเครื่องแล้ว push ขึ้น GitHub Render จะ deploy ใหม่ให้อัตโนมัติ (ตั้ง `autoDeploy: true` ไว้แล้ว)

```bash
git add .
git commit -m "อัปเดต"
git push
```

---

## ข้อควรรู้ของแพ็กเกจฟรี Render

- **เว็บจะ "หลับ" เมื่อไม่มีคนเข้านานเกิน ~15 นาที** คนเข้าครั้งถัดไปจะรอ ~30 วินาทีให้ตื่น (หลังจากนั้นเร็วปกติ)
  - อยากไม่ให้หลับ? ใช้บริการ ping ฟรีอย่าง **cron-job.org** ตั้งให้ยิงเข้า `https://<your-app>.onrender.com/api/health` ทุก 10 นาที (ช่วยลดอาการหลับ แต่จะกินชั่วโมงใช้งานฟรีเร็วขึ้น)
- โควตาฟรี ~750 ชั่วโมง/เดือน (พอสำหรับ 1 service ทั้งเดือน)
- ตอนเพิ่งตื่น/รอบแรก ถ้าดึงดีลสดไม่ทันจะแสดง **ข้อมูลตัวอย่าง** ไปก่อน แล้วรอบรีเฟรชถัดไปจะเป็นของจริง

---

## ต่อโดเมนของคุณเอง (เช่น tour.changtrixget.com)

1. ใน Render เปิด service → **Settings → Custom Domains → Add Custom Domain**
2. ใส่โดเมนที่ต้องการ เช่น `tour.changtrixget.com`
3. Render จะให้ค่า **CNAME** ไปใส่ในผู้ให้บริการโดเมนของคุณ (เช่น Cloudflare, GoDaddy)
4. รอ DNS อัปเดต (ไม่กี่นาที–ชั่วโมง) แล้วใช้ HTTPS ได้ฟรีอัตโนมัติ

---

## ปัญหาที่พบบ่อย

| อาการ | วิธีแก้ |
|---|---|
| Build fail "node version" | มีไฟล์ `.node-version` (=20) แล้ว ถ้ายังพลาด ตั้ง env `NODE_VERSION=20` |
| เปิดเว็บแล้วเป็นข้อมูลตัวอย่างตลอด | connector ยังเป็นสแคฟโฟลด์/เว็บต้นทางเปลี่ยนโครงสร้าง ดู README หัวข้อ connectors |
| เว็บช้าตอนเปิดครั้งแรก | ปกติของ free tier (เพิ่งตื่นจากหลับ) ใช้ cron ping ช่วยได้ |

เสร็จแล้ว! เว็บ ChangTrixGet ทัวร์ไฟไหม้ของคุณออนไลน์ฟรีเรียบร้อย 🔥
