import { LightningElement, track, wire } from 'lwc';
import getInvoices from '@salesforce/apex/InvoiceController.getInvoices';
import getInvoiceDetail from '@salesforce/apex/InvoiceController.getInvoiceDetail';
import saveInvoiceLine from '@salesforce/apex/InvoiceController.saveInvoiceLine';

export default class InvoiceDataCombined extends LightningElement {
    @track data = [];
    @track error;
    @track showInvoice = true;
    @track showInvoiceLine = false;
    @track invoiceId;
    @track invoiceData = [];
    @track lineItems = [];
    @track showAddProduct = false;
    
    @track selectedInvoice = null;
    @track productOptions = [];
    @track productName = '';
    @track quantity = '';
    @track price = '';
    @track taxes = '';
    @track invoiceLineList = [];

    // Invoice Data Table Columns
    @track invoiceColumns = [
        { label: 'Invoice Number', fieldName: 'Name', sortable: "true" },
        { label: 'Invoice Date', fieldName: 'Invoice_Date__c', type: 'date' },
        {
            label: 'Buyer Name',
            fieldName: 'buyerUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'BuyerName' }, target: '_blank' },
            sortable: "true"
        },
        {
            label: 'Seller Name',
            fieldName: 'sellerUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'SellerName' }, target: '_blank' },
            sortable: "true"
        },
        { label: 'Invoice Status', fieldName: 'Invoice_Status__c' },
        { label: 'Pending Amount', fieldName: 'Pending_Amount__c' },
    ];

    // Line Item Columns
    @track lineItemColumns = [
     //{ label: '', fieldName: 'rowNumber', type: 'number', cellAttributes: { alignment: 'center' } },
        {
            label: 'Product Name',
            fieldName: 'ProductUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'ProductName' }, target: '_blank' }
        },
        { label: 'Quantity', fieldName: 'Quantity__c', type: 'number' },
        { label: 'Price', fieldName: 'Price__c', type: 'currency' },
        { label: 'Product Total', fieldName: 'Product_Total__c', type: 'currency' },
        { label: 'Taxes', fieldName: 'Taxes__c', type: 'currency' },
        { label: 'Grand Total', fieldName: 'Grand_Total__c', type: 'currency' }
    ];


    @track currentPage = 1;
    @track pageSize = 10; // 10 records per page
    @track totalPages = 0;
    @track pagedLineItems = [];

    // Fetch list of invoices
    @wire(getInvoices)
    wiredInvoices({ error, data }) {
        if (data) {
            this.data = data.map(row => ({
                Id: row.Id,
                Name: row.Name,
                Invoice_Date__c: row.Invoice_Date__c,
                Invoice_Status__c: row.Invoice_Status__c,
                BuyerName: row.Buyer_Name__r ? row.Buyer_Name__r.Name : '',
                buyerUrl: row.Buyer_Name__r ? '/' + row.Buyer_Name__r.Id : '',
                invoiceUrl: '/' + row.Id
            }));
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.data = [];
        }
    }

    // Handler for Open button click
    handleOpen(event) {
        this.showInvoice = false;
        const invoiceId = event.currentTarget.dataset.id;
        this.fetchInvoiceData(invoiceId);
        this.selectedInvoice = event.detail.row;
    }

    // Fetch details of selected invoice
    fetchInvoiceData(invoiceId) {
        this.showInvoiceLine = true;
        
        getInvoiceDetail({ invoiceId })
            .then(result => {
                this.invoiceData = [{
                    Name: result.invoice.Name,
                    Invoice_Date__c: result.invoice.Invoice_Date__c,
                    BuyerName: result.invoice.Buyer_Name__r?.Name,
                    buyerUrl: '/' + result.invoice.Buyer_Name__r?.Id,
                    SellerName: result.invoice.Seller_Name__r?.Name,
                    sellerUrl: '/' + result.invoice.Seller_Name__r?.Id,
                    Invoice_Status__c: result.invoice.Invoice_Status__c,
                    Pending_Amount__c: result.invoice.Pending_Amount__c
                }];
                this.lineItems = result.lineItems.map(item => ({
                    ...item,
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
                this.invoiceData = [];
                this.lineItems = [];
            });
    }

    // Modal Invice Table
openInvoiceTable(){
        this.showInvoice = true;
        this.showInvoiceLine = false;
        this.invoiceData = [];
        this.lineItems = [];
    }


   


    // Pagination logic
     updatePagedLineItems() {
        const start = (this.currentPage - 1) * this.pageSize;
     
            const end = start + this.pageSize;
         this.pagedLineItems = this.lineItems.slice(start, end);

        //const pageItems = this.lineItems.slice(start, end);
          
        //this.pagedLineItems = pageItems.map((item, index) => ({
        //...item,
        //rowNumber: index + 1 + start // Or index + 1 if you want restart from 1

//    }));
    }

  goToPrevious() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagedLineItems();
        }
    }

  goToNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagedLineItems();
        }
    }

    get pagePrevious() {
        return this.currentPage === 1;
    }

    get pageNext() {
        return this.currentPage === this.totalPages;
    }

 // Modal handlers
   openAddProductClick() {
        this.showAddProduct = true;
        this.loadProduct();
    } 

    closeAddProductClick() {
        this.showAddProduct = false;
    }

    handleSave() {
        console.log('Product saved!');
        this.closeModal();
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

     handleInputChange(event) {
        const field = event.target.name;
        this[field] = event.target.value;
    }

handleSave() {
        if (!this.productName || !this.quantity || !this.price || !this.taxes) {
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
            Invoice__c: this.selectedInvoice.Id,
            Product__c: this.productName,
            Quantity__c: this.quantity,
            Price__c: this.price,
            Taxes__c: this.taxes
        };

        this.invoiceLineList.push(invoiceLine);

        saveInvoiceLine({ invoiceLineList: this.invoiceLineList })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Invoice Line Added Successfully!',
                    variant: 'success',
                    mode: 'dismissable'
                }));
                this.showAddProduct = false;
                this.resetFields();
                this.getInvoiceLineTable();
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
     resetFields() {
        this.productName = '';
        this.quantity = '';
        this.price = '';
        this.taxes = '';
    }

}
    



/* import { LightningElement, track, wire} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getInvoices from '@salesforce/apex/InvoiceController.getInvoices';
export default class InvoiceDatatableWithWire extends NavigationMixin(LightningElement) {
@track data;
@track columns = [
         {label: 'Invoice Number', fieldName: 'invoiceUrl', type: 'url', 
            typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' },
            sortable: "true"
        },
        { label: 'Invoice Date', fieldName: 'Invoice_Date__c', type: 'date' , sortable: "true"},
        { label: 'Buyer Name', fieldName: 'buyerUrl', type: 'url',
            typeAttributes: { label: { fieldName: 'BuyerName' }, target: '_blank' },
            sortable: "true"
        },
        { label: 'Invoice Status', fieldName: 'Invoice_Status__c', type: 'text' , sortable: "true"},
        {
            type: 'button',
            label: 'Action',
            typeAttributes: {
                label: 'Open',
                name: 'open',
                title: 'Click to open',
                variant: 'brand',
            },
        },
    ];
@track error;
  @track sortBy;
    @track sortDirection;

@wire(getInvoices) 
wiredInvoices({ error, data }) {
    if (data) {
        // Flatten the Buyer_Name__r.Name field into BuyerName
        this.data = data.map(row => ({
            ...row,
             BuyerName: row.Buyer_Name__r ? row.Buyer_Name__r.Name : '',
                buyerUrl: row.Buyer_Name__r ? '/' + row.Buyer_Name__r.Id : '',
                invoiceUrl: '/' + row.Id
        }));
        this.error = undefined;
    } else if (error) {
        this.error = error;
        this.data = undefined;
    }   
}

   handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'open') {
            this.navigateToInvoiceDetail(row.Id);
            console.log('Current Invoice Id:', row.Id);
        }
    }

    navigateToInvoiceDetail(invoiceId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'Invoice_Details_Page'
            },
            state: {
                c__invoiceId: invoiceId
            }
        });
    }    

      doSorting(event) {
        // calling sortdata function to sort the data based on direction and selected field
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
    }

    
}
    */