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

export const exportSalesReportToExcel = (data: any[], reportType: string) => {
    const workbook = XLSX.utils.book_new()

    let excelData: any[] = []
    let filename = ''

    switch (reportType) {
        case 'sales':
            excelData = data.map(order => ({
                'Order ID': order.id,
                'Customer Name': order.customers?.name || 'N/A',
                'Customer Email': order.customers?.email || 'N/A',
                'Salesman': `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || 'N/A',
                'Total Amount (₹)': order.total_amount,
                'Status': order.status,
                'Order Date': new Date(order.created_at).toLocaleDateString('en-IN'),
                'Order Time': new Date(order.created_at).toLocaleTimeString('en-IN')
            }))
            filename = `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`
            break

        case 'payments':
            excelData = data.map(payment => ({
                'Payment ID': payment.id,
                'Customer Name': payment.customers?.name || 'N/A',
                'Customer Email': payment.customers?.email || 'N/A',
                'Payment Method': payment.payment_method,
                'Amount (₹)': payment.amount,
                'Status': payment.status,
                'Payment Date': new Date(payment.created_at).toLocaleDateString('en-IN'),
                'Payment Time': new Date(payment.created_at).toLocaleTimeString('en-IN')
            }))
            filename = `Payments_Report_${new Date().toISOString().split('T')[0]}.xlsx`
            break

        case 'inventory':
            excelData = data.map(product => ({
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
    const columnWidths: any[] = []

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