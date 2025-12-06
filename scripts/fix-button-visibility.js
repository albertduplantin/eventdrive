const fs = require('fs');
const path = require('path');

// Patterns de boutons peu visibles à améliorer
const buttonPatterns = [
  {
    // Boutons ghost avec icônes seulement (difficiles à voir)
    find: /<Button\s+variant="ghost"\s+size="sm"\s*>/g,
    replace: '<Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-100">',
    description: 'Ghost buttons → Outline with border'
  },
  {
    // Boutons ghost génériques
    find: /<Button\s+variant="ghost"\s*>/g,
    replace: '<Button variant="outline" className="border-gray-300">',
    description: 'Generic ghost buttons → Outline'
  },
  {
    // Boutons outline sans styling supplémentaire
    find: /<Button\s+variant="outline"\s+([^>]*?)(?<!className=")>/g,
    replace: '<Button variant="outline" $1 className="border-gray-300 hover:bg-gray-50">',
    description: 'Outline buttons → Add border color'
  }
];

const filesToProcess = [
  'components/features/onboarding-form-with-invitation.tsx',
  'app/(dashboard)/dashboard/settings/invitations/page.tsx',
  'app/(dashboard)/dashboard/drivers/new/page.tsx',
  'app/(dashboard)/dashboard/drivers/[id]/availability/page.tsx',
  'app/(dashboard)/dashboard/drivers/[id]/page.tsx',
  'app/(dashboard)/dashboard/drivers/page.tsx',
  'app/(dashboard)/dashboard/transports/page.tsx',
  'app/(dashboard)/dashboard/vips/new/page.tsx',
  'app/(dashboard)/dashboard/vips/page.tsx',
  'app/(dashboard)/dashboard/vips/[id]/page.tsx',
  'app/(dashboard)/dashboard/missions/new/page.tsx',
  'app/(dashboard)/dashboard/missions/page.tsx',
  'app/(dashboard)/dashboard/my-availabilities/page.tsx',
  'app/(dashboard)/dashboard/history/page.tsx',
  'app/(dashboard)/dashboard/reports/page.tsx',
  'components/features/dashboard-header.tsx',
  'app/page.tsx'
];

let totalChanges = 0;

filesToProcess.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;

  buttonPatterns.forEach(pattern => {
    const matches = content.match(pattern.find);
    if (matches) {
      content = content.replace(pattern.find, pattern.replace);
      fileChanges += matches.length;
      console.log(`  ✓ ${pattern.description}: ${matches.length} changes`);
    }
  });

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${file} (${fileChanges} changes)`);
    totalChanges += fileChanges;
  }
});

console.log(`\n✅ Total: ${totalChanges} button visibility improvements`);
