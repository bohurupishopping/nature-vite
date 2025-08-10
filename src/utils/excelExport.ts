import * as XLSX from 'xlsx'

export interface DetailedSalesReportItem {
    order_number: string
    order_date: string
    order_status: string
    customer_name: string
    salesman_name: string
    product_name: string
    product_sku: string
    quantity_sold: number
    unit_price: number
    line_item_total: number
}

// Report interfaces for the new SQL functions
export interface SalesVsTargetReport {
    period_name: string
    start_date: string
    end_date: string
    target_amount: number
    actual_amount: number
    variance_amount: number
    target_quantity: number
    actual_quantity: number
    variance_quantity: number
}

export interface SalesmanPerformanceReport {
    salesman_name: string
    target_amount: number
    actual_amount: number
    variance_amount: number
    target_quantity: number
    actual_quantity: number
    variance_quantity: number
}

export interface ProductPerformanceReport {
    product_name: string
    target_amount: number
    actual_amount: number
    variance_amount: number
    target_quantity: number
    actual_quantity: number
    variance_quantity: number
}

export interface CustomerPerformanceReport {
    customer_name: string
    target_amount: number
    actual_amount: number
    variance_amount: number
    target_quantity: number
    actual_quantity: number
    variance_quantity: number
}

export interface DistrictPerformanceReport {
    district: string
    target_amount: number
    actual_amount: number
    variance_amount: number
    target_quantity: number
    actual_quantity: number
    variance_quantity: number
}

export interface SalesTrendReport {
    sales_date?: string
    week_start_date?: string
    month_start_date?: string
    total_sales: number
    number_of_orders: number
}

export interface TopCustomersReport {
    customer_name: string
    total_sales_value: number
    total_items_purchased: number
}

export interface CustomerPurchaseHistoryReport {
    order_date: string
    order_number: string
    product_name: string
    quantity: number
    unit_price: number
    item_total: number
    order_status: string
}

export interface CustomerDuesReport {
    customer_id: string
    customer_name: string
    contact_person: string
    phone_number: string
    address: string
    customer_type: string
    total_sales: number
    total_paid: number
    due_amount: number
}

export interface NewVsExistingCustomerReport {
    customer_category: string
    total_sales: number
}

export const exportDetailedSalesReportToExcel = (
    data: DetailedSalesReportItem[],
    startDate: string,
    endDate: string
) => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Prepare data for Excel with proper headers
    const excelData = data.map(item => ({
        'Order Number': item.order_number,
        'Order Date': new Date(item.order_date).toLocaleDateString('en-IN'),
        'Order Status': item.order_status,
        'Customer Name': item.customer_name,
        'Salesman Name': item.salesman_name || 'N/A',
        'Product Name': item.product_name,
        'Product SKU': item.product_sku,
        'Quantity Sold': item.quantity_sold,
        'Unit Price (₹)': item.unit_price,
        'Line Total (₹)': item.line_item_total
    }))

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths for better readability
    const columnWidths = [
        { wch: 15 }, // Order Number
        { wch: 12 }, // Order Date
        { wch: 12 }, // Order Status
        { wch: 20 }, // Customer Name
        { wch: 20 }, // Salesman Name
        { wch: 25 }, // Product Name
        { wch: 15 }, // Product SKU
        { wch: 12 }, // Quantity Sold
        { wch: 15 }, // Unit Price
        { wch: 15 }  // Line Total
    ]
    worksheet['!cols'] = columnWidths

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Sales Report')

    // Create summary worksheet
    const summary = createSummarySheet(data)
    XLSX.utils.book_append_sheet(workbook, summary, 'Summary')

    // Generate filename with date range
    const filename = `Detailed_Sales_Report_${startDate}_to_${endDate}.xlsx`

    // Write and download the file
    XLSX.writeFile(workbook, filename)
}

// Comprehensive Sales Analysis Report with multiple tabs
export const exportComprehensiveSalesReport = (
    reportData: {
        salesVsTarget?: SalesVsTargetReport[]
        salesmanPerformance?: SalesmanPerformanceReport[]
        productPerformance?: ProductPerformanceReport[]
        customerPerformance?: CustomerPerformanceReport[]
        districtPerformance?: DistrictPerformanceReport[]
        salesTrendDaily?: SalesTrendReport[]
        salesTrendWeekly?: SalesTrendReport[]
        salesTrendMonthly?: SalesTrendReport[]
        topCustomers?: TopCustomersReport[]
        customerDues?: CustomerDuesReport[]
        newVsExisting?: NewVsExistingCustomerReport[]
    },
    periodName: string,
    dateRange?: { startDate: string; endDate: string }
) => {
    const workbook = XLSX.utils.book_new()

    // 1. Sales vs Target Achievement Tab
    if (reportData.salesVsTarget && reportData.salesVsTarget.length > 0) {
        const salesVsTargetData = reportData.salesVsTarget.map(item => ({
            'Period Name': item.period_name,
            'Start Date': new Date(item.start_date).toLocaleDateString('en-IN'),
            'End Date': new Date(item.end_date).toLocaleDateString('en-IN'),
            'Target Amount (₹)': item.target_amount.toLocaleString('en-IN'),
            'Actual Amount (₹)': item.actual_amount.toLocaleString('en-IN'),
            'Variance Amount (₹)': item.variance_amount.toLocaleString('en-IN'),
            'Target Quantity': item.target_quantity,
            'Actual Quantity': item.actual_quantity,
            'Variance Quantity': item.variance_quantity,
            'Achievement %': item.target_amount > 0 ? ((item.actual_amount / item.target_amount) * 100).toFixed(2) + '%' : 'N/A'
        }))

        const salesVsTargetSheet = XLSX.utils.json_to_sheet(salesVsTargetData)
        salesVsTargetSheet['!cols'] = Array(10).fill({ wch: 15 })
        XLSX.utils.book_append_sheet(workbook, salesVsTargetSheet, 'Sales vs Target')
    }

    // 2. Salesman Performance Tab
    if (reportData.salesmanPerformance && reportData.salesmanPerformance.length > 0) {
        const salesmanData = reportData.salesmanPerformance.map(item => ({
            'Salesman Name': item.salesman_name,
            'Target Amount (₹)': item.target_amount.toLocaleString('en-IN'),
            'Actual Amount (₹)': item.actual_amount.toLocaleString('en-IN'),
            'Variance Amount (₹)': item.variance_amount.toLocaleString('en-IN'),
            'Target Quantity': item.target_quantity,
            'Actual Quantity': item.actual_quantity,
            'Variance Quantity': item.variance_quantity,
            'Achievement %': item.target_amount > 0 ? ((item.actual_amount / item.target_amount) * 100).toFixed(2) + '%' : 'N/A'
        }))

        const salesmanSheet = XLSX.utils.json_to_sheet(salesmanData)
        salesmanSheet['!cols'] = Array(8).fill({ wch: 18 })
        XLSX.utils.book_append_sheet(workbook, salesmanSheet, 'Salesman Performance')
    }

    // 3. Product Performance Tab
    if (reportData.productPerformance && reportData.productPerformance.length > 0) {
        const productData = reportData.productPerformance.map(item => ({
            'Product Name': item.product_name,
            'Target Amount (₹)': item.target_amount.toLocaleString('en-IN'),
            'Actual Amount (₹)': item.actual_amount.toLocaleString('en-IN'),
            'Variance Amount (₹)': item.variance_amount.toLocaleString('en-IN'),
            'Target Quantity': item.target_quantity,
            'Actual Quantity': item.actual_quantity,
            'Variance Quantity': item.variance_quantity,
            'Achievement %': item.target_amount > 0 ? ((item.actual_amount / item.target_amount) * 100).toFixed(2) + '%' : 'N/A'
        }))

        const productSheet = XLSX.utils.json_to_sheet(productData)
        productSheet['!cols'] = Array(8).fill({ wch: 18 })
        XLSX.utils.book_append_sheet(workbook, productSheet, 'Product Performance')
    }

    // 4. Customer Performance Tab
    if (reportData.customerPerformance && reportData.customerPerformance.length > 0) {
        const customerData = reportData.customerPerformance.map(item => ({
            'Customer Name': item.customer_name,
            'Target Amount (₹)': item.target_amount.toLocaleString('en-IN'),
            'Actual Amount (₹)': item.actual_amount.toLocaleString('en-IN'),
            'Variance Amount (₹)': item.variance_amount.toLocaleString('en-IN'),
            'Target Quantity': item.target_quantity,
            'Actual Quantity': item.actual_quantity,
            'Variance Quantity': item.variance_quantity,
            'Achievement %': item.target_amount > 0 ? ((item.actual_amount / item.target_amount) * 100).toFixed(2) + '%' : 'N/A'
        }))

        const customerSheet = XLSX.utils.json_to_sheet(customerData)
        customerSheet['!cols'] = Array(8).fill({ wch: 18 })
        XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Performance')
    }

    // 5. District Performance Tab
    if (reportData.districtPerformance && reportData.districtPerformance.length > 0) {
        const districtData = reportData.districtPerformance.map(item => ({
            'District': item.district,
            'Target Amount (₹)': item.target_amount.toLocaleString('en-IN'),
            'Actual Amount (₹)': item.actual_amount.toLocaleString('en-IN'),
            'Variance Amount (₹)': item.variance_amount.toLocaleString('en-IN'),
            'Target Quantity': item.target_quantity,
            'Actual Quantity': item.actual_quantity,
            'Variance Quantity': item.variance_quantity,
            'Achievement %': item.target_amount > 0 ? ((item.actual_amount / item.target_amount) * 100).toFixed(2) + '%' : 'N/A'
        }))

        const districtSheet = XLSX.utils.json_to_sheet(districtData)
        districtSheet['!cols'] = Array(8).fill({ wch: 18 })
        XLSX.utils.book_append_sheet(workbook, districtSheet, 'District Performance')
    }

    // 6. Sales Trend Daily Tab
    if (reportData.salesTrendDaily && reportData.salesTrendDaily.length > 0) {
        const dailyTrendData = reportData.salesTrendDaily.map(item => ({
            'Date': new Date(item.sales_date!).toLocaleDateString('en-IN'),
            'Total Sales (₹)': item.total_sales.toLocaleString('en-IN'),
            'Number of Orders': item.number_of_orders
        }))

        const dailyTrendSheet = XLSX.utils.json_to_sheet(dailyTrendData)
        dailyTrendSheet['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(workbook, dailyTrendSheet, 'Daily Sales Trend')
    }

    // 7. Sales Trend Weekly Tab
    if (reportData.salesTrendWeekly && reportData.salesTrendWeekly.length > 0) {
        const weeklyTrendData = reportData.salesTrendWeekly.map(item => ({
            'Week Starting': new Date(item.week_start_date!).toLocaleDateString('en-IN'),
            'Total Sales (₹)': item.total_sales.toLocaleString('en-IN'),
            'Number of Orders': item.number_of_orders
        }))

        const weeklyTrendSheet = XLSX.utils.json_to_sheet(weeklyTrendData)
        weeklyTrendSheet['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(workbook, weeklyTrendSheet, 'Weekly Sales Trend')
    }

    // 8. Sales Trend Monthly Tab
    if (reportData.salesTrendMonthly && reportData.salesTrendMonthly.length > 0) {
        const monthlyTrendData = reportData.salesTrendMonthly.map(item => ({
            'Month Starting': new Date(item.month_start_date!).toLocaleDateString('en-IN'),
            'Total Sales (₹)': item.total_sales.toLocaleString('en-IN'),
            'Number of Orders': item.number_of_orders
        }))

        const monthlyTrendSheet = XLSX.utils.json_to_sheet(monthlyTrendData)
        monthlyTrendSheet['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(workbook, monthlyTrendSheet, 'Monthly Sales Trend')
    }

    // 9. Top Customers Tab
    if (reportData.topCustomers && reportData.topCustomers.length > 0) {
        const topCustomersData = reportData.topCustomers.map((item, index) => ({
            'Rank': index + 1,
            'Customer Name': item.customer_name,
            'Total Sales Value (₹)': item.total_sales_value.toLocaleString('en-IN'),
            'Total Items Purchased': item.total_items_purchased
        }))

        const topCustomersSheet = XLSX.utils.json_to_sheet(topCustomersData)
        topCustomersSheet['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 18 }]
        XLSX.utils.book_append_sheet(workbook, topCustomersSheet, 'Top Customers')
    }

    // 10. Customer Dues Tab
    if (reportData.customerDues && reportData.customerDues.length > 0) {
        const customerDuesData = reportData.customerDues.map(item => ({
            'Customer Name': item.customer_name,
            'Contact Person': item.contact_person || 'N/A',
            'Phone Number': item.phone_number || 'N/A',
            'Customer Type': item.customer_type || 'N/A',
            'Total Sales (₹)': item.total_sales.toLocaleString('en-IN'),
            'Total Paid (₹)': item.total_paid.toLocaleString('en-IN'),
            'Due Amount (₹)': item.due_amount.toLocaleString('en-IN')
        }))

        const customerDuesSheet = XLSX.utils.json_to_sheet(customerDuesData)
        customerDuesSheet['!cols'] = Array(7).fill({ wch: 18 })
        XLSX.utils.book_append_sheet(workbook, customerDuesSheet, 'Customer Dues')
    }

    // 11. New vs Existing Customers Tab
    if (reportData.newVsExisting && reportData.newVsExisting.length > 0) {
        const newVsExistingData = reportData.newVsExisting.map(item => ({
            'Customer Category': item.customer_category,
            'Total Sales (₹)': item.total_sales.toLocaleString('en-IN')
        }))

        const newVsExistingSheet = XLSX.utils.json_to_sheet(newVsExistingData)
        newVsExistingSheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(workbook, newVsExistingSheet, 'New vs Existing')
    }

    // Generate filename
    const dateStr = dateRange ? `${dateRange.startDate}_to_${dateRange.endDate}` : new Date().toISOString().split('T')[0]
    const filename = `Comprehensive_Sales_Report_${periodName.replace(/\s+/g, '_')}_${dateStr}.xlsx`

    // Write and download the file
    XLSX.writeFile(workbook, filename)
}

// Export Customer Purchase History Report
export const exportCustomerPurchaseHistoryReport = (
    data: CustomerPurchaseHistoryReport[],
    customerName: string
) => {
    const workbook = XLSX.utils.book_new()

    const excelData = data.map(item => ({
        'Order Date': new Date(item.order_date).toLocaleDateString('en-IN'),
        'Order Number': item.order_number,
        'Product Name': item.product_name,
        'Quantity': item.quantity,
        'Unit Price (₹)': item.unit_price.toLocaleString('en-IN'),
        'Item Total (₹)': item.item_total.toLocaleString('en-IN'),
        'Order Status': item.order_status
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    worksheet['!cols'] = [
        { wch: 12 }, // Order Date
        { wch: 15 }, // Order Number
        { wch: 25 }, // Product Name
        { wch: 10 }, // Quantity
        { wch: 15 }, // Unit Price
        { wch: 15 }, // Item Total
        { wch: 12 }  // Order Status
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase History')

    const filename = `Customer_Purchase_History_${customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename)
}

const createSummarySheet = (data: DetailedSalesReportItem[]) => {
    // Calculate summary statistics
    const totalOrders = new Set(data.map(item => item.order_number)).size
    const totalRevenue = data.reduce((sum, item) => sum + item.line_item_total, 0)
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity_sold, 0)
    const uniqueCustomers = new Set(data.map(item => item.customer_name)).size
    const uniqueProducts = new Set(data.map(item => item.product_name)).size

    // Group by order status
    const statusSummary = data.reduce((acc, item) => {
        if (!acc[item.order_status]) {
            acc[item.order_status] = { count: 0, revenue: 0 }
        }
        acc[item.order_status].revenue += item.line_item_total
        return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    // Count unique orders per status
    const ordersByStatus = data.reduce((acc, item) => {
        if (!acc[item.order_status]) {
            acc[item.order_status] = new Set()
        }
        acc[item.order_status].add(item.order_number)
        return acc
    }, {} as Record<string, Set<string>>)

    Object.keys(statusSummary).forEach(status => {
        statusSummary[status].count = ordersByStatus[status].size
    })

    // Top products by quantity
    const productSummary = data.reduce((acc, item) => {
        if (!acc[item.product_name]) {
            acc[item.product_name] = { quantity: 0, revenue: 0 }
        }
        acc[item.product_name].quantity += item.quantity_sold
        acc[item.product_name].revenue += item.line_item_total
        return acc
    }, {} as Record<string, { quantity: number; revenue: number }>)

    const topProducts = Object.entries(productSummary)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 10)

    // Create summary data
    const summaryData = [
        { Metric: 'Total Orders', Value: totalOrders },
        { Metric: 'Total Revenue (₹)', Value: totalRevenue.toLocaleString('en-IN') },
        { Metric: 'Total Quantity Sold', Value: totalQuantity },
        { Metric: 'Unique Customers', Value: uniqueCustomers },
        { Metric: 'Unique Products', Value: uniqueProducts },
        { Metric: '', Value: '' }, // Empty row
        { Metric: 'ORDER STATUS BREAKDOWN', Value: '' },
        ...Object.entries(statusSummary).map(([status, data]) => ({
            Metric: `${status.toUpperCase()} Orders`,
            Value: `${data.count} orders (₹${data.revenue.toLocaleString('en-IN')})`
        })),
        { Metric: '', Value: '' }, // Empty row
        { Metric: 'TOP 10 PRODUCTS BY QUANTITY', Value: '' },
        ...topProducts.map(([product, data]) => ({
            Metric: product,
            Value: `${data.quantity} units (₹${data.revenue.toLocaleString('en-IN')})`
        }))
    ]

    const worksheet = XLSX.utils.json_to_sheet(summaryData)

    // Set column widths
    worksheet['!cols'] = [
        { wch: 30 }, // Metric
        { wch: 25 }  // Value
    ]

    return worksheet
}

interface Order {
    id: string
    customers?: { name?: string }
    profiles?: { full_name?: string }
    total_amount: number
    status: string
    created_at: string
}

interface Payment {
    id: string
    customers?: { name?: string }
    payment_method: string
    amount: number
    status: string
    created_at: string
}

interface Product {
    name: string
    sku?: string
    description?: string
    stock_quantity: number
    unit?: string
    price: number
}

type ReportData = Order[] | Payment[] | Product[]

export const exportSalesReportToExcel = (data: ReportData, reportType: string) => {
    const workbook = XLSX.utils.book_new()

    let excelData: Record<string, unknown>[] = []
    let filename = ''

    switch (reportType) {
        case 'sales':
            excelData = (data as Order[]).map(order => ({
                'Order ID': order.id,
                'Customer Name': order.customers?.name || 'N/A',

                'Salesman': order.profiles?.full_name || 'N/A',
                'Total Amount (₹)': order.total_amount,
                'Status': order.status,
                'Order Date': new Date(order.created_at).toLocaleDateString('en-IN'),
                'Order Time': new Date(order.created_at).toLocaleTimeString('en-IN')
            }))
            filename = `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`
            break

        case 'payments':
            excelData = (data as Payment[]).map(payment => ({
                'Payment ID': payment.id,
                'Customer Name': payment.customers?.name || 'N/A',

                'Payment Method': payment.payment_method,
                'Amount (₹)': payment.amount,
                'Status': payment.status,
                'Payment Date': new Date(payment.created_at).toLocaleDateString('en-IN'),
                'Payment Time': new Date(payment.created_at).toLocaleTimeString('en-IN')
            }))
            filename = `Payments_Report_${new Date().toISOString().split('T')[0]}.xlsx`
            break

        case 'inventory':
            excelData = (data as Product[]).map(product => ({
                'Product Name': product.name,
                'SKU': product.sku || 'N/A',
                'Description': product.description || 'N/A',
                'Stock Quantity': product.stock_quantity,
                'Unit': product.unit || 'N/A',
                'Price (₹)': product.price,
                'Status': product.stock_quantity < 10 ? 'LOW STOCK' : 'IN STOCK'
            }))
            filename = `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`
            break
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const columnWidths: { wch: number }[] = []

    for (let col = range.s.c; col <= range.e.c; col++) {
        let maxWidth = 10
        for (let row = range.s.r; row <= range.e.r; row++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
            const cell = worksheet[cellAddress]
            if (cell && cell.v) {
                const cellLength = cell.v.toString().length
                maxWidth = Math.max(maxWidth, cellLength)
            }
        }
        columnWidths.push({ wch: Math.min(maxWidth + 2, 50) })
    }

    worksheet['!cols'] = columnWidths
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType.charAt(0).toUpperCase() + reportType.slice(1))

    XLSX.writeFile(workbook, filename)
}