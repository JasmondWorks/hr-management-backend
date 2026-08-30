import prisma from './src/core/config/prisma';
async function run() {
  try {
    await prisma.user.findUnique({ where: { email: "admin@example.com" }});
  } catch (e) {
    console.error(e);
  }
}
run();
