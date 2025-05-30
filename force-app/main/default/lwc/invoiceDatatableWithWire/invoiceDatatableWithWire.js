import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getInvoices from '@salesforce/apex/InvoiceController.getInvoices';

export default class InvoiceDatatableWithWire extends NavigationMixin(LightningElement) {
    @track data = [];
    @track error;
    @track showCard = true; 

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

    handleOpen(event) {
        this.showCard = false;
        const invoiceId = event.currentTarget.dataset.id;
        this.navigateToInvoiceDetail(invoiceId);
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