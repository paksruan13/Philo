const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log(':rocket: Setting up database...');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log(':white_check_mark: Database connection successful');
    
    // Create a default admin user if it doesn't exist
    const adminEmail = 'admin@projectphi.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log(':white_check_mark: Default admin user created:');
      console.log('   Email: admin@projectphi.com');
      console.log('   Password: admin123');
      console.log('   Please change this password after first login!');
    } else {
      console.log(':information_source:  Admin user already exists');
    }
    // Create sample activity categories if they don't exist
    const existingCategories = await prisma.activityCategory.count();
    if (existingCategories === 0) {
      await prisma.activityCategory.createMany({
        data: [
          {
            name: 'Community Service',
            description: 'Volunteer and community engagement activities',
            color: '#10B981',
            icon: 'heart'
          },
          {
            name: 'Academic Excellence',
            description: 'Educational and academic achievements',
            color: '#3B82F6',
            icon: 'book'
          },
          {
            name: 'Sports & Fitness',
            description: 'Physical activities and sports participation',
            color: '#F59E0B',
            icon: 'trophy'
          }
        ]
      });
      console.log(':white_check_mark: Sample activity categories created');
    } else {
      console.log(':information_source:  Activity categories already exist');
    }
 // Create a sample team for testing
 const existingTeams = await prisma.team.count();
 if (existingTeams === 0) {
   const sampleTeam = await prisma.team.create({
     data: {
       name: 'Sample Team',
       teamCode: 'SAMPLE1',
       isActive: true
     }
   });
   console.log('✅ Sample team created with code: SAMPLE1');
 } else {
   console.log('ℹ️  Teams already exist');
 }
 
 console.log('🎉 Database setup completed successfully!');
 console.log('\n📋 Next steps for your collaborators:');
 console.log('1. Start the development server: npm run dev');
 console.log('2. Access admin panel with admin@projectphi.com / admin123');
 console.log('3. Create teams and manage activities through the admin interface');
 
} catch (error) {
 console.error('❌ Database setup failed:', error);
 process.exit(1);
}
}

main()
.catch((e) => {
 console.error('❌ Setup script failed:', e);
 process.exit(1);
})
.finally(async () => {
 await prisma.$disconnect();
});