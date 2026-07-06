const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content);
}

// 1. app/actions/product.ts
replaceFile('app/actions/product.ts', c => {
  return c
    .replace(/version: formData.get\('version'\) as string \|\| '1.0',\n\s*price: parseFloat\(formData.get\('price'\) as string \|\| '0'\),\n\s*status: formData.get\('status'\) as string \|\| 'Published'/g, "is_active: formData.get('is_active') === 'on'")
    .replace(/status: 'Archived'/g, "is_active: false")
    .replace(/status: 'Published'/g, "is_active: true")
    .replace(/update\(\{ status: 'Archived' \}\)/g, "update({ is_active: false })")
    .replace(/update\(\{ status: 'Published' \}\)/g, "update({ is_active: true })");
});

// 2. ProductForm.tsx
replaceFile('components/products/ProductForm.tsx', c => {
  const replacement = `<div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                defaultChecked={initialData?.is_active ?? true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Active Product
              </label>
            </div>`;
  
  c = c.replace(/<div>\s*<label className="block text-sm font-medium mb-1">Price \*\*<\/label>[\s\S]*?<option value="Archived">Archived<\/option>\s*<\/select>\s*<\/div>/g, replacement);
  c = c.replace(/<div>\s*<label className="block text-sm font-medium mb-1">Price \*<\/label>[\s\S]*?<option value="Archived">Archived<\/option>\s*<\/select>\s*<\/div>/g, replacement);
  return c;
});

// 3. Products Page
replaceFile('app/(dashboard)/dashboard/products/page.tsx', c => {
  return c
    .replace(/status, created_at/g, 'is_active, created_at')
    .replace(/if \(isActiveFilter === 'active'\) {\n\s*productsQuery = productsQuery.eq\('status', 'Published'\)\n\s*} else if \(isActiveFilter === 'inactive'\) {\n\s*productsQuery = productsQuery.eq\('status', 'Archived'\)\n\s*}/g, "if (isActiveFilter === 'active') {\n    productsQuery = productsQuery.eq('is_active', true)\n  } else if (isActiveFilter === 'inactive') {\n    productsQuery = productsQuery.eq('is_active', false)\n  }")
    .replace(/select\('status'\)/g, "select('is_active')")
    .replace(/p\.status === 'Published'/g, "p.is_active === true")
    .replace(/p\.status === 'Archived'/g, "p.is_active === false")
    .replace(/<th className="px-6 py-4">Status<\/th>/g, '<th className="px-6 py-4">Active</th>')
    .replace(/product\.status === 'Published'/g, "product.is_active")
    .replace(/{product\.status}/g, "{product.is_active ? 'Active' : 'Inactive'}");
});

// 4. Products [id]
replaceFile('app/(dashboard)/dashboard/products/[id]/page.tsx', c => {
  return c
    .replace(/status, price, version, created_at/g, 'is_active, created_at')
    .replace(/product\.status === 'Published'/g, "product.is_active")
    .replace(/{product\.status}/g, "{product.is_active ? 'Active' : 'Inactive'}")
    .replace(/<div>\s*<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Version<\/h3>[\s\S]*?<p className="text-gray-900 dark:text-white mt-1">₹{product.price \|\| 0}<\/p>\s*<\/div>/g, '');
});

// 5. Products Edit
replaceFile('app/(dashboard)/dashboard/products/[id]/edit/page.tsx', c => {
  return c.replace(/status, version, price, created_at/g, 'is_active, created_at');
});

// 6. SalesCustomerForm
replaceFile('components/sales/SalesCustomerForm.tsx', c => {
  return c
    .replace(/eq\('status', 'Published'\)/g, "eq('is_active', true)")
    .replace(/select\('id, name, price'\)/g, "select('id, name')")
    .replace(/if \(p && p\.price\) {\n\s*setPrice\(p\.price\.toString\(\)\)\n\s*}/g, '');
});

console.log('Reverted successfully!');
