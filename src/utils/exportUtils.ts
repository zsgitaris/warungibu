
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface RevenueData {
  date: string;
  revenue: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface PopularMenuData {
  name: string;
  quantity: number;
}

interface AnalyticsData {
  revenueByDay?: RevenueData[];
  orderStatusData?: OrderStatusData[];
  popularMenuData?: PopularMenuData[];
}

export const exportToPDF = (data: AnalyticsData) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Analytics Report', 20, 20);
  
  // Date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString('id-ID')}`, 20, 35);
  
  let yPosition = 50;
  
  // Revenue Table
  if (data.revenueByDay && data.revenueByDay.length > 0) {
    doc.setFontSize(14);
    doc.text('Revenue 7 Hari Terakhir', 20, yPosition);
    yPosition += 10;
    
    const revenueTableData = data.revenueByDay.map(item => [
      item.date,
      `Rp ${item.revenue.toLocaleString('id-ID')}`
    ]);
    
    autoTable(doc, {
      head: [['Tanggal', 'Revenue']],
      body: revenueTableData,
      startY: yPosition,
      margin: { left: 20 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Order Status Table
  if (data.orderStatusData && data.orderStatusData.length > 0) {
    doc.setFontSize(14);
    doc.text('Status Pesanan', 20, yPosition);
    yPosition += 10;
    
    const statusTableData = data.orderStatusData.map(item => [
      item.status,
      item.count.toString()
    ]);
    
    autoTable(doc, {
      head: [['Status', 'Jumlah']],
      body: statusTableData,
      startY: yPosition,
      margin: { left: 20 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Popular Menu Table
  if (data.popularMenuData && data.popularMenuData.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Menu Paling Populer', 20, yPosition);
    yPosition += 10;
    
    const menuTableData = data.popularMenuData.map(item => [
      item.name,
      item.quantity.toString()
    ]);
    
    autoTable(doc, {
      head: [['Menu', 'Terjual']],
      body: menuTableData,
      startY: yPosition,
      margin: { left: 20 },
    });
  }
  
  // Calculate totals
  const totalRevenue = data.revenueByDay?.reduce((sum, day) => sum + day.revenue, 0) || 0;
  const avgDaily = Math.round(totalRevenue / 7);
  const topMenu = data.popularMenuData?.[0];
  
  // Summary section
  if ((doc as any).lastAutoTable) {
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }
  
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Ringkasan', 20, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.text(`Total Revenue 7 Hari: Rp ${totalRevenue.toLocaleString('id-ID')}`, 20, yPosition);
  yPosition += 10;
  doc.text(`Rata-rata per Hari: Rp ${avgDaily.toLocaleString('id-ID')}`, 20, yPosition);
  yPosition += 10;
  if (topMenu) {
    doc.text(`Menu Terlaris: ${topMenu.name} (${topMenu.quantity} terjual)`, 20, yPosition);
  }
  
  doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (data: AnalyticsData) => {
  const workbook = XLSX.utils.book_new();
  
  // Revenue worksheet
  if (data.revenueByDay && data.revenueByDay.length > 0) {
    const revenueData = data.revenueByDay.map(item => ({
      'Tanggal': item.date,
      'Revenue': item.revenue
    }));
    
    const revenueWS = XLSX.utils.json_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(workbook, revenueWS, 'Revenue 7 Hari');
  }
  
  // Order status worksheet
  if (data.orderStatusData && data.orderStatusData.length > 0) {
    const statusData = data.orderStatusData.map(item => ({
      'Status': item.status,
      'Jumlah': item.count
    }));
    
    const statusWS = XLSX.utils.json_to_sheet(statusData);
    XLSX.utils.book_append_sheet(workbook, statusWS, 'Status Pesanan');
  }
  
  // Popular menu worksheet
  if (data.popularMenuData && data.popularMenuData.length > 0) {
    const menuData = data.popularMenuData.map(item => ({
      'Menu': item.name,
      'Terjual': item.quantity
    }));
    
    const menuWS = XLSX.utils.json_to_sheet(menuData);
    XLSX.utils.book_append_sheet(workbook, menuWS, 'Menu Populer');
  }
  
  // Summary worksheet
  const totalRevenue = data.revenueByDay?.reduce((sum, day) => sum + day.revenue, 0) || 0;
  const avgDaily = Math.round(totalRevenue / 7);
  const topMenu = data.popularMenuData?.[0];
  
  const summaryData = [
    { 'Metrik': 'Total Revenue 7 Hari', 'Nilai': `Rp ${totalRevenue.toLocaleString('id-ID')}` },
    { 'Metrik': 'Rata-rata per Hari', 'Nilai': `Rp ${avgDaily.toLocaleString('id-ID')}` },
    { 'Metrik': 'Menu Terlaris', 'Nilai': topMenu ? `${topMenu.name} (${topMenu.quantity} terjual)` : 'Belum ada data' }
  ];
  
  const summaryWS = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWS, 'Ringkasan');
  
  XLSX.writeFile(workbook, `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};
