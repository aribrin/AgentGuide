import {prisma} from './prisma/client';

async function main() {
    const agent = await prisma.agent.create({
        data: {name: 'Test Agent', version: '1.0'},
    });
    console.log('Created agent:', agent);
}

main().finally(() => prisma.$disconnect());