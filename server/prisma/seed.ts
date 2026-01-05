// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Buat password yang sudah di-hash (dienkripsi)
  const passwordAdmin = await bcrypt.hash('admin123', 10)
  const passwordTeknisi = await bcrypt.hash('teknisi123', 10)

  // 2. Buat User Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Super Admin',
      username: 'admin',
      password: passwordAdmin,
      role: 'ADMIN',
    },
  })

  // 3. Buat User Teknisi (Contoh)
  const teknisi = await prisma.user.upsert({
    where: { username: 'teknisi' },
    update: {},
    create: {
      name: 'Budi Teknisi',
      username: 'teknisi',
      password: passwordTeknisi,
      role: 'TECHNICIAN',
    },
  })

  console.log({ admin, teknisi })
  console.log("✅ Data awal berhasil dibuat!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })