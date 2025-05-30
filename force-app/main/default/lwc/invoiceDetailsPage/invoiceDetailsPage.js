import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';
import getInvoiceDetail from '@salesforce/apex/InvoiceController.getInvoiceDetail';

export default class InvoiceDetailPage extends NavigationMixin(LightningElement) {
    @track invoiceId;
    @track invoiceData = [];
    @track invoiceColumns = [
         {label: 'Invoice Number',  fieldName: 'Name', sortable: "true"},
        { label: 'Invoice Date', fieldName: 'Invoice_Date__c', type: 'date' },
        {
        label: 'Buyer Name',
        fieldName: 'buyerUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'BuyerName' },
            target: '_blank'
        }
        , sortable: "true"
    },
        {
        label: 'Seller Name',
        fieldName: 'sellerUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'SellerName' },
            target: '_blank'
        }   
        , sortable: "true"
    },
        { label: 'Invoice Status', fieldName: 'Invoice_Status__c' },
        { label: 'Pending Amount', fieldName: 'Pending_Amount__c'},
        
      ];

    @track lineItems = [];
    @track lineItemColumns = [
          {
        label: 'Product Name',
        fieldName: 'ProductUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'ProductName' },
            target: '_blank'
        }
    },
        { label: 'Quantity', fieldName: 'Quantity__c', type: 'number' },
        { label: 'Price', fieldName: 'Price__c', type: 'currency' },
        { label: 'Product Total', fieldName: 'Product_Total__c', type: 'currency' },
        { label: 'Taxes', fieldName: 'Taxes__c', type: 'currency' },
        { label: 'Grand Total', fieldName: 'Grand_Total__c', type: 'currency' }
    ];

    @track error;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference && currentPageReference.state) {
            this.invoiceId = currentPageReference.state.c__invoiceId;
            if (this.invoiceId) {
                this.fetchInvoiceData();
            }
        }
    }

    fetchInvoiceData() {
        getInvoiceDetail({ invoiceId: this.invoiceId })
            .then(result => {
            this.invoiceData = [{
                Name: result.invoice.Name,
                Invoice_Date__c: result.invoice.Invoice_Date__c,
                BuyerName: result.invoice.Buyer_Name__r?.Name,
                buyerUrl: '/' + result.invoice.Buyer_Name__r?.Name,
                SellerName: result.invoice.Seller_Name__r?.Name,
                sellerUrl: '/' + result.invoice.Seller_Name__r?.Name,
                Invoice_Status__c: result.invoice.Invoice_Status__c,
                Pending_Amount__c: result.invoice.Pending_Amount__c
            }];
              // Map lineItems to include Product URL
            this.lineItems = result.lineItems.map(item => {
                return {
                    ...item,
                    ProductName: item.Product__r?.Name,
                    ProductUrl: '/' + item.Product__c
                };
            });
            this.error = undefined;
        })
            .catch(error => {
                this.error = error;
                this.invoiceData = [];
                this.lineItems = [];
            });
    }
 navigateToProducts() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                apiName: 'Invoice_Line__c',
                actionName: 'new'
            }
        });
    }


    navigateToInvoiceDatatablePage() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'Invoices_Data_Table'
            },
            state: {
                c__invoiceId: invoiceId
            }
        });
    }    


 @track isModalOpen = false;

    openModal() {
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    handleSave() {
        // Add your save logic here (e.g., call an Apex method or update a record)
        console.log('Product saved!');
        this.closeModal();
    }


}
























/* import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getInvoiceDetail from '@salesforce/apex/InvoiceController.getInvoiceDetail';

export default class InvoiceDetailPage extends LightningElement {
    invoiceId;
    invoiceData;
    lineItems;
    error;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.invoiceId = currentPageReference.state.c__invoiceId;
            this.loadInvoiceData();
        }
    }

    loadInvoiceData() {
        getInvoiceDetail({ invoiceId: this.invoiceId })
            .then(result => {
                this.invoiceData = result.invoice;
                this.lineItems = result.lineItems;
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.invoiceData = undefined;
                this.lineItems = undefined;
            });
    }
}
*/