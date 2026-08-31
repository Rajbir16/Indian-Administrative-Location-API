import { prisma } from './src/config/database.js';

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database schema...\n');

    // Expected models
    const expectedModels = [
      'Country',
      'State',
      'District',
      'SubDistrict',
      'Village',
      'User',
      'ApiKey',
      'UserStateAccess',
      'ApiLog'
    ];

    // Get database tables via Prisma
    const results = [];
    
    for (const model of expectedModels) {
      try {
        switch(model) {
          case 'Country':
            await prisma.country.findFirst();
            results.push({ model, exists: true });
            break;
          case 'State':
            await prisma.state.findFirst();
            results.push({ model, exists: true });
            break;
          case 'District':
            await prisma.district.findFirst();
            results.push({ model, exists: true });
            break;
          case 'SubDistrict':
            await prisma.subDistrict.findFirst();
            results.push({ model, exists: true });
            break;
          case 'Village':
            await prisma.village.findFirst();
            results.push({ model, exists: true });
            break;
          case 'User':
            await prisma.user.findFirst();
            results.push({ model, exists: true });
            break;
          case 'ApiKey':
            await prisma.apiKey.findFirst();
            results.push({ model, exists: true });
            break;
          case 'UserStateAccess':
            await prisma.userStateAccess.findFirst();
            results.push({ model, exists: true });
            break;
          case 'ApiLog':
            await prisma.apiLog.findFirst();
            results.push({ model, exists: true });
            break;
        }
      } catch (error) {
        results.push({ model, exists: false, error: error.message });
      }
    }

    // Display results
    console.log('📊 Database Schema Verification Results:\n');
    console.log('| Model | Status |');
    console.log('|-------|--------|');
    
    let allExists = true;
    for (const result of results) {
      const status = result.exists ? '✅ EXISTS' : '❌ MISSING';
      console.log(`| ${result.model.padEnd(15)} | ${status} |`);
      if (!result.exists) allExists = false;
    }

    console.log('\n' + '='.repeat(40));
    if (allExists) {
      console.log('✅ All 9 database tables verified successfully!');
      console.log('✅ Database schema is complete and ready.');
    } else {
      console.log('❌ Some tables are missing!');
    }
    console.log('='.repeat(40));

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase();
