import { LightningElement, track, wire } from 'lwc';
import getInvoices from '@salesforce/apex/InvoiceController.getInvoices';
import getInvoiceDetail from '@salesforce/apex/InvoiceController.getInvoiceDetail';
import saveInvoiceLine from '@salesforce/apex/InvoiceController.saveInvoiceLine';
import getProducts from '@salesforce/apex/InvoiceController.getProducts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class InvoiceDataCombined extends LightningElement {
    @track data = [];
    @track error;
    @track showInvoice = true;
    @track showInvoiceLine = false;
    @track invoiceId;
    @track invoiceData = [];
    @track lineItems = [];
    @track showAddProduct = false;
    @track selectedInvoice;
        
    @track productOptions = [];
    @track selectedProduct = '';
    @track quantity = '';
    @track price = '';
    @track taxes = '';
    @track invoiceLineList = [];

    @track currentPage = 1;
    @track pageSize = 10; // 10 records per page
    @track totalPages = 0;
    @track pagedLineItems = [];
    @track rowOffset = 0;

    @track sortBy;
    @track sortDirection;

    // Invoice Data Table Columns
    @track invoiceColumns = [
        {
            label: 'Invoice Number',
            fieldName: 'invoiceIdUrl',
            type: 'url',
            typeAttributes: { label: {fieldName: 'Name'}, target: '_blank'},
            sortable: "true",
            cellAttributes: { alignment: 'center' }
        },
        { label: 'Invoice Date', fieldName: 'Invoice_Date__c', type: 'date', cellAttributes: { alignment: 'center' } },
        {
            label: 'Buyer Name',
            fieldName: 'buyerUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'BuyerName' }, target: '_blank' },
            sortable: "true"
        },
              { label: 'Invoice Status', fieldName: 'Invoice_Status__c' },
        {
        label: 'Open', type: 'button', typeAttributes: {
            label: 'View',
            name: 'view',
            title: 'Click to view Invoice',
            variant: 'brand',
            iconPosition: 'center',
        }
    },
    ];

    // Line Item Columns
    @track lineItemColumns = [
     //{ label: '', fieldName: 'rowNumber', type: 'number', cellAttributes: { alignment: 'center' } },
        {
            label: 'Product Name',
            fieldName: 'ProductUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'ProductName' }, target: '_blank' },
            sortable: true
        },
         {
            label: 'Invoice Item',
            fieldName: 'invoiceLineUrl',
            type: 'url',
            typeAttributes: { label: {fieldName: 'invoiceLineName'}, target: '_blank'},
            sortable: "true",
            cellAttributes: { alignment: 'center' }
        },
        { label: 'Quantity', fieldName: 'Quantity__c', type: 'number', sortable: true},
        { label: 'Price', fieldName: 'Price__c', type: 'currency', sortable: true},
        { label: 'Product Total', fieldName: 'Product_Total__c', type: 'currency', sortable: true },
        { label: 'Taxes', fieldName: 'Taxes__c', type: 'currency', sortable: true },
        { label: 'Tax Fees', fieldName: 'Tax_Fees__c', type: 'currency', sortable: true },
        { label: 'Grand Total', fieldName: 'Grand_Total__c', type: 'currency', sortable: true },
        	
    ];

    // Fetch list of invoices
    @wire(getInvoices)
    wiredInvoices({ error, data}) {
        if (data) {
            this.data = data.map(row => ({
                Id: row.Id,
                Name: row.Name,
                invoiceIdUrl: '/' + row.Id,
                Invoice_Date__c: row.Invoice_Date__c,
                Invoice_Status__c: row.Invoice_Status__c,
                BuyerName: row.Buyer_Name__r ? row.Buyer_Name__r.Name : '',
                buyerUrl: row.Buyer_Name__r ? '/' + row.Buyer_Name__r.Id : '',
                invoiceUrl: '/' + row.Id
            }));
       
        } else if (error) {
            this.error = error;
            this.data = [];
        }
    }

    // Handler for Open button click
    handleRowAction(event) {
        this.showInvoice = false;
        //const invoiceId = event.currentTarget.dataset.id;
        const row = event.detail.row; // Get the full row data
        const invoiceId = row.Id; 
        this.selectedInvoice = row;
        this.showInvoiceLine = true;
        this.fetchInvoiceData(invoiceId);
        
    }

    // Fetch details of selected invoice
    fetchInvoiceData(invoiceId) {
         this.invoiceId = invoiceId; // Ensure invoiceId is set for later use
            return  getInvoiceDetail({ invoiceId })
                .then(result => {
                    this.invoiceData = {
                        Name: result.invoice.Name,
                        invoiceNameUrl: '/' + result.invoice.Id,
                        Invoice_Date__c: result.invoice.Invoice_Date__c,
                        BuyerName: result.invoice.Buyer_Name__r?.Name,
                        buyerUrl: '/' + result.invoice.Buyer_Name__r?.Id,
                        SellerName: result.invoice.Seller_Name__r?.Name,
                        sellerUrl: '/' + result.invoice.Seller_Name__r?.Id,
                        Invoice_Status__c: result.invoice.Invoice_Status__c,
                        Pending_Amount__c: result.invoice.Pending_Amount__c
                    };
                    this.lineItems = result.lineItems.map((item, index) => ({
                        ...item,
                        invoiceLineName: item.Name,
                        invoiceLineUrl  : '/' + item.Id, 
                        ProductName: item.Product__r?.Name,
                        ProductUrl: '/' + item.Product__c,
                        //rowNumber: index + 1,
                    }));
    
                    this.currentPage = 1;
                    this.totalPages = Math.ceil(this.lineItems.length / this.pageSize);
                    this.updatePagedLineItems();
                    
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    this.invoiceData = {};
                    this.lineItems = [];
                });
        }

    // Open Invoice Data Table
    openInvoiceTable(){
        this.showInvoice = true;
        this.showInvoiceLine = false;
        this.invoiceData = {};
        this.lineItems = [];
    }

    // Pagination logic
     updatePagedLineItems() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.pagedLineItems = this.lineItems.slice(start, end);
        this.rowOffset = start;

        /* this.pagedLineItems = this.lineItems.slice(start, end)
        .map((item, index) => ({
        ...item,
        rowNumber: start + index + 1 // Or index + 1 if you want restart from 1
    })); */
    }
// Go to the first page
  goToPrevious() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagedLineItems();
        }
    }
// Go to the next page
  goToNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagedLineItems();
        }
    }
// Check if the current page is the first page
    get pagePrevious() {
        return this.currentPage === 1;
    }
// Check if the current page is the last page
    get pageNext() {
        return this.currentPage === this.totalPages;
    }

 // Open modal for adding a product
    openAddProductClick() {
        this.showAddProduct = true;
        this.loadProduct();
    } 
// Close modal for adding a product
    closeAddProductClick() {
        this.showAddProduct = false;
        this.resetFields();
    }

// Load product options for the select input
    loadProduct() {
        getProducts()
            .then(result => {
                this.productOptions = result.map(res => ({
                    label: res.Name,
                    value: res.Id
                }));
            })
            .catch(error => {
                console.error('Error fetching products', error);
            });
    }
// Handle input changes for the form fields
     handleInputChange(event) {
        const field = event.target.name;
        this[field] = event.target.value;
    }

    // Handle save action for adding a new product to the invoice
    handleSave(){
        console.log('Selected Invoice Id:', this.invoiceId);

    if (!this.selectedProduct || !this.quantity || !this.price || !this.taxes) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Missing Data',
            message: 'Please fill all fields before saving.',
            variant: 'error',
            mode: 'dismissable'
        }));
        return;
    }

    const invoiceLine = {
        SobjectType: 'Invoice_Line__c',
        My_Invoice__c: this.invoiceId,
        Product__c: this.selectedProduct,
        Quantity__c: this.quantity,
        Price__c: this.price,
        Taxes__c: this.taxes
    };

     this.invoiceLineList.push(invoiceLine);

    saveInvoiceLine({ invoiceLineList: this.invoiceLineList})
        .then(() => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Invoice Line Added Successfully!',
                variant: 'success',
                mode: 'dismissable'
            }));
            this.showAddProduct = false;
            this.resetFields();
            this.invoiceLineList = [];
            this.fetchInvoiceData(this.invoiceId);
        })
        .catch(error => {
            console.error('Error saving product:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || 'Failed to save product.',
                variant: 'error',
                mode: 'dismissable'
            }));
        });
}
    
    // Reset fields after saving
     resetFields() {
        this.selectedProduct = '';
        this.quantity = '';
        this.price = '';
        this.taxes = '';
    }

    // Handle sorting of the data table
      doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection, this.pagedLineItems);
    }
    // Sort data based on field name and direction
    // This function sorts the data based on the field name and direction
    // It takes three parameters: fieldname, direction, and columns
    
    sortData(fieldname, direction, columns) {
        let parseData = JSON.parse(JSON.stringify(columns));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : ''; // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.pagedLineItems = parseData;
    }    

}
    

