// services/api.js — API client with GitHub Pages / Offline Demo Fallback
// Connects to Express backend on port 5000 when running locally,
// and gracefully falls back to persistent sample data when hosted on GitHub Pages!

const BASE_URL = '/api';

// Initial realistic dataset matching batloung_farm_db.sql
const initialData = {
  suppliers: [
    { supplier_id: 1, business_name: 'Ceres Fruit Growers', contact_person: 'Pieter van Wyk', phone: '0213932200', province: 'Western Cape', address: '1 Voortrekker Road, Ceres, 6835' },
    { supplier_id: 2, business_name: 'Vredendal Vine & Produce', contact_person: 'Anna Louw', phone: '0272133321', province: 'Western Cape', address: '22 Kerk Street, Vredendal, 8160' },
    { supplier_id: 3, business_name: 'Tzaneen Tropical Fruits', contact_person: 'Thabo Mahlangu', phone: '0153071122', province: 'Limpopo', address: '18 Agatha Street, Tzaneen, 0850' },
    { supplier_id: 4, business_name: 'Levubu Subtropical Farms', contact_person: 'Riaan Botha', phone: '0155830044', province: 'Limpopo', address: 'Main Road, Levubu, 0929' },
    { supplier_id: 5, business_name: 'Nelspruit Citrus Estates', contact_person: 'Sipho Nkosi', phone: '0137528899', province: 'Mpumalanga', address: '45 Citrus Crescent, Mbombela, 1200' },
    { supplier_id: 6, business_name: 'Ficksburg Cherry & Orchard', contact_person: 'Kobus Meiring', phone: '0519332211', province: 'Free State', address: '12 Voortrekker Street, Ficksburg, 9730' },
    { supplier_id: 7, business_name: 'Bloemfontein Wholesale Produce', contact_person: 'David van Zyl', phone: '0514058000', province: 'Free State', address: 'Market Road, Bloemfontein, 9301' },
    { supplier_id: 8, business_name: 'Sunday River Citrus Co', contact_person: 'Mark Edwards', phone: '0422300045', province: 'Eastern Cape', address: 'Kirkwood Depot, Addo, 6105' },
    { supplier_id: 9, business_name: 'Durban Wholesale Fresh Market', contact_person: 'Pravin Naidoo', phone: '0313111122', province: 'KwaZulu-Natal', address: 'Flower Road, Clairwood, Durban, 4052' },
    { supplier_id: 10, business_name: 'Joburg National Fresh Produce', contact_person: 'Mohamed Patel', phone: '0119928000', province: 'Gauteng', address: 'Heidelberg Road, City Deep, 2049' },
    { supplier_id: 11, business_name: 'Tshwane Fresh Produce Market', contact_person: 'Willem Pretorius', phone: '0123582000', province: 'Gauteng', address: 'DF Malan Drive, Pretoria, 0002' },
    { supplier_id: 12, business_name: 'Rustenburg Citrus & Mangoes', contact_person: 'Keabetswe Modise', phone: '0145928811', province: 'North West', address: 'Kloof Road, Rustenburg, 0299' },
  ],
  fruits: [
    { fruit_id: 1, fruit_name: 'Apples', description: 'Crisp red and green apples, graded for the street trade', status: 'ACTIVE' },
    { fruit_id: 2, fruit_name: 'Bananas', description: 'Ripe yellow bananas, sold in whole boxes', status: 'ACTIVE' },
    { fruit_id: 3, fruit_name: 'Oranges', description: 'Sweet Valencia oranges from Limpopo', status: 'ACTIVE' },
    { fruit_id: 4, fruit_name: 'Mangoes', description: 'Tommy Atkins mangoes from Mpumalanga', status: 'ACTIVE' },
    { fruit_id: 5, fruit_name: 'Grapes', description: 'Seedless red and white table grapes', status: 'ACTIVE' },
    { fruit_id: 6, fruit_name: 'Peaches', description: 'Free State cling peaches for retail', status: 'ACTIVE' },
    { fruit_id: 7, fruit_name: 'Pears', description: 'Packham Triumph pears, firm and sweet', status: 'ACTIVE' },
    { fruit_id: 8, fruit_name: 'Watermelons', description: 'Large sweet watermelons sold individually or boxed', status: 'ACTIVE' },
    { fruit_id: 9, fruit_name: 'Pineapples', description: 'Queen pineapples from Eastern Cape', status: 'ACTIVE' },
    { fruit_id: 10, fruit_name: 'Lemons', description: 'Juicy Eureka lemons for market stalls', status: 'INACTIVE' },
  ],
  vendors: [
    { vendor_id: 1, vendor_name: 'Maseru Main Market Stall 12', phone_number: '+266 5800 1122', location: 'Maseru Market, Maseru', registration_date: '2024-02-14' },
    { vendor_id: 2, vendor_name: 'Thabo Fruit Corner', phone_number: '+266 5811 2233', location: 'Maseru Mall Road, Maseru', registration_date: '2024-03-02' },
    { vendor_id: 3, vendor_name: 'Lerato Street Fruits', phone_number: '+266 5822 3344', location: 'Lancers Road, Maseru', registration_date: '2024-03-18' },
    { vendor_id: 4, vendor_name: 'Pitso Ground Veg & Fruit', phone_number: '+266 5833 4455', location: 'Pitso Ground, Maseru', registration_date: '2024-04-05' },
    { vendor_id: 5, vendor_name: 'Motheo Retail Hub', phone_number: '+266 5844 5566', location: 'Cathedral Area, Maseru', registration_date: '2024-04-20' },
    { vendor_id: 6, vendor_name: 'Khotso Spaza & Fruit', phone_number: '+266 5855 6677', location: 'Lithabaneng, Maseru', registration_date: '2024-05-11' },
    { vendor_id: 7, vendor_name: 'Palesa Mini Market', phone_number: '+266 5866 7788', location: 'Ha Thetsane, Maseru', registration_date: '2024-06-01' },
    { vendor_id: 8, vendor_name: 'Bohlokwa Fruit Depot', phone_number: '+266 5877 8899', location: 'Khubetsoana, Maseru', registration_date: '2024-06-15' },
    { vendor_id: 9, vendor_name: 'Teboho Street Corner', phone_number: '+266 5888 9900', location: 'Mabote, Maseru', registration_date: '2024-07-04' },
    { vendor_id: 10, vendor_name: 'Rethabile Fresh Mart', phone_number: '+266 5899 0011', location: 'Kingsway Road, Maseru', registration_date: '2024-07-22' },
  ],
  stock: [
    { stock_id: 1, fruit_id: 1, fruit_name: 'Apples', packaging_size: 'SMALL', available_quantity: 120, reorder_level: 20 },
    { stock_id: 2, fruit_id: 1, fruit_name: 'Apples', packaging_size: 'MEDIUM', available_quantity: 85, reorder_level: 15 },
    { stock_id: 3, fruit_id: 1, fruit_name: 'Apples', packaging_size: 'LARGE', available_quantity: 6, reorder_level: 10 },
    { stock_id: 4, fruit_id: 2, fruit_name: 'Bananas', packaging_size: 'SMALL', available_quantity: 200, reorder_level: 25 },
    { stock_id: 5, fruit_id: 2, fruit_name: 'Bananas', packaging_size: 'MEDIUM', available_quantity: 140, reorder_level: 20 },
    { stock_id: 6, fruit_id: 2, fruit_name: 'Bananas', packaging_size: 'LARGE', available_quantity: 45, reorder_level: 12 },
    { stock_id: 7, fruit_id: 3, fruit_name: 'Oranges', packaging_size: 'SMALL', available_quantity: 160, reorder_level: 20 },
    { stock_id: 8, fruit_id: 3, fruit_name: 'Oranges', packaging_size: 'MEDIUM', available_quantity: 95, reorder_level: 15 },
    { stock_id: 9, fruit_id: 3, fruit_name: 'Oranges', packaging_size: 'LARGE', available_quantity: 38, reorder_level: 10 },
    { stock_id: 10, fruit_id: 4, fruit_name: 'Mangoes', packaging_size: 'SMALL', available_quantity: 50, reorder_level: 15 },
    { stock_id: 11, fruit_id: 4, fruit_name: 'Mangoes', packaging_size: 'MEDIUM', available_quantity: 40, reorder_level: 10 },
    { stock_id: 12, fruit_id: 4, fruit_name: 'Mangoes', packaging_size: 'LARGE', available_quantity: 12, reorder_level: 8 },
    { stock_id: 13, fruit_id: 5, fruit_name: 'Grapes', packaging_size: 'SMALL', available_quantity: 75, reorder_level: 15 },
    { stock_id: 14, fruit_id: 5, fruit_name: 'Grapes', packaging_size: 'MEDIUM', available_quantity: 60, reorder_level: 12 },
    { stock_id: 15, fruit_id: 5, fruit_name: 'Grapes', packaging_size: 'LARGE', available_quantity: 18, reorder_level: 8 },
  ],
  sales: [
    {
      sale_id: 1, vendor_id: 1, vendor_name: 'Maseru Main Market Stall 12', phone_number: '+266 5800 1122', location: 'Maseru Market',
      sale_date: '2026-09-03', payment_status: 'PAID', payment_method: 'CASH', total_amount: 3800, amount_paid: 3800, outstanding_balance: 0, total_boxes: 30,
      items: [{ fruit_name: 'Apples', packaging_size: 'MEDIUM', quantity: 10, unit_price: 240, line_total: 2400 }, { fruit_name: 'Bananas', packaging_size: 'SMALL', quantity: 20, unit_price: 70, line_total: 1400 }]
    },
    {
      sale_id: 2, vendor_id: 2, vendor_name: 'Thabo Fruit Corner', phone_number: '+266 5811 2233', location: 'Maseru Mall Road',
      sale_date: '2026-09-06', payment_status: 'PAID', payment_method: 'MOBILE_MONEY', total_amount: 1875, amount_paid: 1875, outstanding_balance: 0, total_boxes: 15,
      items: [{ fruit_name: 'Bananas', packaging_size: 'LARGE', quantity: 15, unit_price: 125, line_total: 1875 }]
    },
    {
      sale_id: 3, vendor_id: 3, vendor_name: 'Lerato Street Fruits', phone_number: '+266 5822 3344', location: 'Lancers Road',
      sale_date: '2026-09-10', payment_status: 'PARTIALLY_PAID', payment_method: 'CREDIT', total_amount: 4500, amount_paid: 2000, outstanding_balance: 2500, total_boxes: 25,
      items: [{ fruit_name: 'Oranges', packaging_size: 'MEDIUM', quantity: 25, unit_price: 180, line_total: 4500 }]
    },
  ],
  purchases: [
    {
      purchase_id: 1, supplier_id: 1, business_name: 'Ceres Fruit Growers', province: 'Western Cape', contact_person: 'Pieter van Wyk', phone: '0213932200',
      purchase_date: '2026-09-02', total_amount: 11325, status: 'COMPLETED', total_boxes: 65,
      items: [{ fruit_name: 'Apples', packaging_size: 'MEDIUM', quantity: 40, unit_cost: 180, line_total: 7200 }, { fruit_name: 'Grapes', packaging_size: 'MEDIUM', quantity: 25, unit_cost: 165, line_total: 4125 }]
    },
  ],
  payments: [
    { payment_id: 1, sale_id: 1, vendor_name: 'Maseru Main Market Stall 12', amount: 3800, payment_method: 'CASH', payment_date: '2026-09-03', reference: 'CASH-01', payment_status: 'PAID' },
    { payment_id: 2, sale_id: 2, vendor_name: 'Thabo Fruit Corner', amount: 1875, payment_method: 'MOBILE_MONEY', payment_date: '2026-09-06', reference: 'MP-89234', payment_status: 'PAID' },
    { payment_id: 3, sale_id: 3, vendor_name: 'Lerato Street Fruits', amount: 2000, payment_method: 'CASH', payment_date: '2026-09-10', reference: 'CASH-02', payment_status: 'PARTIALLY_PAID' },
  ]
};

// Check if running on GitHub Pages
const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

function getStore() {
  const saved = localStorage.getItem('batloung_demo_data');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('batloung_demo_data', JSON.stringify(initialData));
  return initialData;
}

function saveStore(data) {
  localStorage.setItem('batloung_demo_data', JSON.stringify(data));
}

// Client-side fallback handler for GitHub Pages
function handleMock(path, method = 'GET', body = null) {
  const store = getStore();

  if (path.startsWith('/suppliers')) {
    if (method === 'GET') return { success: true, count: store.suppliers.length, data: store.suppliers };
    if (method === 'POST') {
      const newSup = { supplier_id: Date.now(), ...body };
      store.suppliers.unshift(newSup);
      saveStore(store);
      return { success: true, message: 'Supplier registered', data: newSup };
    }
    if (method === 'PUT') {
      const id = Number(path.split('/')[2]);
      store.suppliers = store.suppliers.map(s => s.supplier_id === id ? { ...s, ...body } : s);
      saveStore(store);
      return { success: true, message: 'Supplier updated' };
    }
    if (method === 'DELETE') {
      const id = Number(path.split('/')[2]);
      store.suppliers = store.suppliers.filter(s => s.supplier_id !== id);
      saveStore(store);
      return { success: true, message: 'Supplier deleted' };
    }
  }

  if (path.startsWith('/fruits')) {
    if (method === 'GET') return { success: true, count: store.fruits.length, data: store.fruits };
    if (method === 'POST') {
      const newFruit = { fruit_id: Date.now(), ...body };
      store.fruits.push(newFruit);
      saveStore(store);
      return { success: true, message: 'Fruit created', data: newFruit };
    }
    if (method === 'PUT') {
      const id = Number(path.split('/')[2]);
      store.fruits = store.fruits.map(f => f.fruit_id === id ? { ...f, ...body } : f);
      saveStore(store);
      return { success: true, message: 'Fruit updated' };
    }
  }

  if (path.startsWith('/vendors')) {
    if (method === 'GET') {
      const search = path.includes('search=') ? decodeURIComponent(path.split('search=')[1].toLowerCase()) : '';
      const list = search
        ? store.vendors.filter(v => v.vendor_name.toLowerCase().includes(search) || v.phone_number.includes(search))
        : store.vendors;
      return { success: true, count: list.length, data: list };
    }
    if (method === 'POST') {
      const newVendor = { vendor_id: Date.now(), ...body };
      store.vendors.unshift(newVendor);
      saveStore(store);
      return { success: true, message: 'Vendor registered', data: newVendor };
    }
    if (method === 'PUT') {
      const id = Number(path.split('/')[2]);
      store.vendors = store.vendors.map(v => v.vendor_id === id ? { ...v, ...body } : v);
      saveStore(store);
      return { success: true, message: 'Vendor updated' };
    }
  }

  if (path.startsWith('/stock')) {
    if (path.includes('/low')) {
      const low = store.stock.filter(s => s.available_quantity <= s.reorder_level);
      return { success: true, count: low.length, data: low };
    }
    return { success: true, count: store.stock.length, data: store.stock };
  }

  if (path.startsWith('/sales')) {
    if (method === 'GET') {
      if (path.includes('/')) {
        const id = Number(path.split('/')[2]);
        if (id) {
          const s = store.sales.find(item => item.sale_id === id);
          return { success: true, data: s || store.sales[0] };
        }
      }
      return { success: true, count: store.sales.length, data: store.sales };
    }
    if (method === 'POST') {
      // 10 large apples test case protection
      for (const item of (body.items || [])) {
        const stockRow = store.stock.find(s => Number(s.fruit_id) === Number(item.fruit_id) && s.packaging_size === item.packaging_size);
        const avail = stockRow ? stockRow.available_quantity : 0;
        if (avail < item.quantity) {
          throw new Error(`Insufficient stock for ${item.fruit_name || 'Fruit'} (${item.packaging_size}): only ${avail} box(es) available but ${item.quantity} requested. The whole sale was rejected.`);
        }
      }
      // Deduct stock
      for (const item of (body.items || [])) {
        const s = store.stock.find(st => Number(st.fruit_id) === Number(item.fruit_id) && st.packaging_size === item.packaging_size);
        if (s) s.available_quantity -= Number(item.quantity);
      }
      const vendor = store.vendors.find(v => v.vendor_id === Number(body.vendor_id)) || { vendor_name: 'Vendor' };
      const total = (body.items || []).reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
      const paid = Number(body.payment?.amount_paid || total);
      const status = paid >= total ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      const newSale = {
        sale_id: Date.now(),
        vendor_id: body.vendor_id,
        vendor_name: vendor.vendor_name,
        phone_number: vendor.phone_number,
        location: vendor.location,
        sale_date: new Date().toISOString().slice(0, 10),
        total_amount: total,
        amount_paid: paid,
        outstanding_balance: Math.max(0, total - paid),
        payment_status: status,
        payment_method: body.payment?.payment_method || 'CASH',
        items: body.items,
        total_boxes: (body.items || []).reduce((sum, it) => sum + it.quantity, 0),
      };
      store.sales.unshift(newSale);
      saveStore(store);
      return { success: true, message: 'Sale recorded and stock updated', data: newSale };
    }
  }

  if (path.startsWith('/purchases')) {
    if (path.includes('/cancel')) {
      const id = Number(path.split('/')[2]);
      const p = store.purchases.find(item => item.purchase_id === id);
      if (p) p.status = 'CANCELLED';
      saveStore(store);
      return { success: true, message: `Purchase #${id} cancelled and stock reversed.`, data: p };
    }
    if (method === 'GET') {
      if (path.includes('/')) {
        const id = Number(path.split('/')[2]);
        if (id) {
          const p = store.purchases.find(item => item.purchase_id === id);
          return { success: true, data: p || store.purchases[0] };
        }
      }
      return { success: true, count: store.purchases.length, data: store.purchases };
    }
    if (method === 'POST') {
      const total = (body.items || []).reduce((sum, it) => sum + it.quantity * it.unit_cost, 0);
      const sup = store.suppliers.find(s => s.supplier_id === Number(body.supplier_id)) || { business_name: 'Supplier' };
      // Increase stock
      for (const item of (body.items || [])) {
        const s = store.stock.find(st => Number(st.fruit_id) === Number(item.fruit_id) && st.packaging_size === item.packaging_size);
        if (s) s.available_quantity += Number(item.quantity);
      }
      const newP = {
        purchase_id: Date.now(),
        supplier_id: body.supplier_id,
        business_name: sup.business_name,
        province: sup.province,
        purchase_date: new Date().toISOString().slice(0, 10),
        total_amount: total,
        status: 'COMPLETED',
        items: body.items,
        total_boxes: (body.items || []).reduce((sum, it) => sum + it.quantity, 0),
      };
      store.purchases.unshift(newP);
      saveStore(store);
      return { success: true, message: 'Purchase recorded and stock updated', data: newP };
    }
  }

  if (path.startsWith('/payments')) {
    if (path.includes('/outstanding')) {
      const out = store.vendors.map(v => {
        const vSales = store.sales.filter(s => s.vendor_id === v.vendor_id);
        const billed = vSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
        const paid = vSales.reduce((sum, s) => sum + (Number(s.amount_paid) || 0), 0);
        return {
          vendor_id: v.vendor_id,
          vendor_name: v.vendor_name,
          phone_number: v.phone_number,
          location: v.location,
          invoice_count: vSales.filter(s => s.outstanding_balance > 0).length,
          total_billed: billed,
          total_paid: paid,
          outstanding_balance: Math.max(0, billed - paid),
        };
      }).filter(v => v.outstanding_balance > 0);
      return { success: true, data: out };
    }
    if (method === 'POST') {
      const sale = store.sales.find(s => s.sale_id === Number(body.sale_id));
      if (sale) {
        sale.amount_paid += Number(body.amount);
        sale.outstanding_balance = Math.max(0, sale.total_amount - sale.amount_paid);
        sale.payment_status = sale.outstanding_balance === 0 ? 'PAID' : 'PARTIALLY_PAID';
        store.payments.unshift({
          payment_id: Date.now(),
          sale_id: sale.sale_id,
          vendor_name: sale.vendor_name,
          amount: Number(body.amount),
          payment_method: body.payment_method,
          reference: body.reference,
          payment_date: new Date().toISOString().slice(0, 10),
          payment_status: sale.payment_status,
        });
        saveStore(store);
      }
      return { success: true, message: 'Payment recorded' };
    }
    return { success: true, count: store.payments.length, data: store.payments };
  }

  if (path.startsWith('/dashboard')) {
    const totalBoxes = store.stock.reduce((sum, s) => sum + s.available_quantity, 0);
    const revenue = store.sales.reduce((sum, s) => sum + s.total_amount, 0);
    const balance = store.sales.reduce((sum, s) => sum + s.outstanding_balance, 0);
    const low = store.stock.filter(s => s.available_quantity <= s.reorder_level).length;
    return {
      success: true,
      data: {
        total_suppliers: store.suppliers.length,
        total_vendors: store.vendors.length,
        total_fruits: store.fruits.filter(f => f.status === 'ACTIVE').length,
        total_stock_boxes: totalBoxes,
        total_sales_revenue: revenue,
        total_outstanding_balance: balance,
        low_stock_count: low,
      }
    };
  }

  if (path.startsWith('/reports/top-fruits')) {
    return {
      success: true,
      data: [
        { fruit_id: 1, fruit_name: 'Apples', boxes_sold: 450, times_sold: 42, revenue: 98000 },
        { fruit_id: 2, fruit_name: 'Bananas', boxes_sold: 380, times_sold: 38, revenue: 45600 },
        { fruit_id: 3, fruit_name: 'Oranges', boxes_sold: 310, times_sold: 30, revenue: 55800 },
        { fruit_id: 4, fruit_name: 'Mangoes', boxes_sold: 210, times_sold: 22, revenue: 46200 },
        { fruit_id: 5, fruit_name: 'Grapes', boxes_sold: 180, times_sold: 19, revenue: 39600 },
      ]
    };
  }

  if (path.startsWith('/reports/revenue')) {
    return {
      success: true,
      data: {
        total_revenue: 55010,
        number_of_sales: 14,
        boxes_sold: 320,
        daily: [
          { sale_day: '2026-09-03', number_of_sales: 2, boxes_sold: 45, revenue: 8400 },
          { sale_day: '2026-09-06', number_of_sales: 3, boxes_sold: 60, revenue: 11200 },
          { sale_day: '2026-09-10', number_of_sales: 4, boxes_sold: 95, revenue: 18500 },
          { sale_day: '2026-09-15', number_of_sales: 5, boxes_sold: 120, revenue: 16910 },
        ]
      }
    };
  }

  if (path.startsWith('/reports/top-vendor')) {
    return {
      success: true,
      data: {
        vendor_id: 1,
        vendor_name: 'Maseru Main Market Stall 12',
        phone_number: '+266 5800 1122',
        location: 'Maseru Market, Maseru',
        total_boxes: 85,
        number_of_purchases: 6,
        total_spent: 18450,
      }
    };
  }

  if (path.startsWith('/reports/stock')) {
    const list = store.stock.map(s => ({
      ...s,
      stock_status: s.available_quantity === 0 ? 'OUT_OF_STOCK' : s.available_quantity <= s.reorder_level ? 'LOW' : 'OK',
    }));
    return { success: true, count: list.length, data: list };
  }

  return { success: true, data: [] };
}

async function request(path, options = {}) {
  // If explicitly hosted on GitHub Pages, use mock immediately
  if (isGitHubPages) {
    return handleMock(path, options.method || 'GET', options.body ? JSON.parse(options.body) : null);
  }

  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const response = await fetch(BASE_URL + path, config);
    let payload = {};
    try {
      payload = await response.json();
    } catch (e) {
      payload = {};
    }
    if (!response.ok) {
      throw new Error(payload.message || 'Request failed (' + response.status + ')');
    }
    return payload;
  } catch (networkError) {
    // If local backend is unreachable (or in static environment), fall back gracefully
    console.warn(`[API] Fallback to demo storage for: ${path}`);
    return handleMock(path, options.method || 'GET', options.body ? JSON.parse(options.body) : null);
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
