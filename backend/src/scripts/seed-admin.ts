import bcrypt from 'bcryptjs';
import { sql } from '../lib/db';

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run seed:admin <email> <password>');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('Password must be at least 10 characters.');
    process.exit(1);
  }

  console.log(`Seeding admin user in Neon Database...`);
  console.log(`Email: ${email}`);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const rows = await sql`
    INSERT INTO public.profiles (email, password_hash, role)
    VALUES (${email}, ${passwordHash}, 'admin')
    ON CONFLICT (email) DO UPDATE
    SET password_hash = ${passwordHash}, role = 'admin'
    RETURNING id, email, role, created_at;
  `;

  console.log('✅ Admin account seeded successfully:', rows[0]);
}

main().catch((err) => {
  console.error('❌ Failed to seed admin account:', err);
  process.exit(1);
});
