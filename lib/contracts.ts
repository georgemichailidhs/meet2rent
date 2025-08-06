import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ContractData {
  // Property Information
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  propertyCity: string;
  propertyArea: number;

  // Tenant Information
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantAddress: string;
  tenantIdNumber: string;

  // Landlord Information
  landlordId: string;
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  landlordAddress: string;
  landlordIdNumber: string;

  // Lease Terms
  monthlyRent: number;
  securityDeposit: number;
  leaseStartDate: Date;
  leaseEndDate: Date;
  leaseDuration: number;

  // Contract Details
  contractId: string;
  generatedDate: Date;
  platformFee?: number;

  // Additional Terms
  utilitiesIncluded: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  furnishedType: 'furnished' | 'semi_furnished' | 'unfurnished';
  specialTerms?: string[];
}

// Generate HTML content for contract preview
export function generateContractHTML(contractData: ContractData): string {
  const formatDate = (date: Date) => date.toLocaleDateString('en-GB');
  const formatCurrency = (amount: number) => `€${amount.toLocaleString()}`;

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px;">
        <h1 style="color: #1e40af; margin: 0; font-size: 24px;">RENTAL AGREEMENT</h1>
        <p style="margin: 5px 0; color: #666;">Contract ID: ${contractData.contractId}</p>
        <p style="margin: 5px 0; color: #666;">Generated: ${formatDate(contractData.generatedDate)}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Property Information</h2>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <p><strong>Property:</strong> ${contractData.propertyTitle}</p>
          <p><strong>Address:</strong> ${contractData.propertyAddress}, ${contractData.propertyCity}</p>
          <p><strong>Area:</strong> ${contractData.propertyArea} m²</p>
          <p><strong>Furnished:</strong> ${contractData.furnishedType.replace('_', ' ')}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div>
          <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Landlord</h2>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p><strong>Name:</strong> ${contractData.landlordName}</p>
            <p><strong>Email:</strong> ${contractData.landlordEmail}</p>
            <p><strong>Phone:</strong> ${contractData.landlordPhone}</p>
            <p><strong>Address:</strong> ${contractData.landlordAddress}</p>
            <p><strong>ID Number:</strong> ${contractData.landlordIdNumber}</p>
          </div>
        </div>
        <div>
          <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Tenant</h2>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p><strong>Name:</strong> ${contractData.tenantName}</p>
            <p><strong>Email:</strong> ${contractData.tenantEmail}</p>
            <p><strong>Phone:</strong> ${contractData.tenantPhone}</p>
            <p><strong>Address:</strong> ${contractData.tenantAddress}</p>
            <p><strong>ID Number:</strong> ${contractData.tenantIdNumber}</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Lease Terms</h2>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <p><strong>Monthly Rent:</strong> ${formatCurrency(contractData.monthlyRent)}</p>
            <p><strong>Security Deposit:</strong> ${formatCurrency(contractData.securityDeposit)}</p>
            <p><strong>Lease Start:</strong> ${formatDate(contractData.leaseStartDate)}</p>
            <p><strong>Lease End:</strong> ${formatDate(contractData.leaseEndDate)}</p>
            <p><strong>Duration:</strong> ${contractData.leaseDuration} months</p>
            <p><strong>Utilities Included:</strong> ${contractData.utilitiesIncluded ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Terms and Conditions</h2>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <p><strong>Pets Allowed:</strong> ${contractData.petsAllowed ? 'Yes' : 'No'}</p>
          <p><strong>Smoking Allowed:</strong> ${contractData.smokingAllowed ? 'Yes' : 'No'}</p>

          ${contractData.specialTerms && contractData.specialTerms.length > 0 ? `
            <div style="margin-top: 15px;">
              <strong>Special Terms:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${contractData.specialTerms.map(term => `<li>${term}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Standard Terms</h2>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 10px; font-size: 14px;">
          <p><strong>1. Payment Terms:</strong> Rent is due on the 1st of each month. Late payments may incur additional fees.</p>
          <p><strong>2. Security Deposit:</strong> The security deposit will be held for the duration of the lease and returned upon satisfactory completion of the lease terms.</p>
          <p><strong>3. Maintenance:</strong> The tenant is responsible for keeping the property clean and reporting any damages promptly.</p>
          <p><strong>4. Termination:</strong> Either party may terminate this lease with 30 days written notice.</p>
          <p><strong>5. Legal Compliance:</strong> This agreement is governed by Greek law and any disputes will be resolved in Greek courts.</p>
        </div>
      </div>

      ${contractData.platformFee ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Platform Fee</h2>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p><strong>Meet2Rent Platform Fee:</strong> ${formatCurrency(contractData.platformFee)}</p>
            <p style="font-size: 12px; color: #666;">One-time fee for platform services and contract generation.</p>
          </div>
        </div>
      ` : ''}

      <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div style="text-align: center; border-top: 2px solid #e5e7eb; padding-top: 20px;">
          <p style="margin: 0; font-weight: bold;">Landlord Signature</p>
          <p style="margin: 5px 0; color: #666;">${contractData.landlordName}</p>
          <p style="margin: 5px 0; color: #666;">Date: _______________</p>
        </div>
        <div style="text-align: center; border-top: 2px solid #e5e7eb; padding-top: 20px;">
          <p style="margin: 0; font-weight: bold;">Tenant Signature</p>
          <p style="margin: 5px 0; color: #666;">${contractData.tenantName}</p>
          <p style="margin: 5px 0; color: #666;">Date: _______________</p>
        </div>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p>This contract was generated by Meet2Rent platform and is legally binding under Greek law.</p>
        <p>For any questions or disputes, please contact Meet2Rent support.</p>
      </div>
    </div>
  `;
}

// Generate PDF contract
export async function generateRentalContract(contractData: ContractData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary div with the contract HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateContractHTML(contractData);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Convert to canvas then PDF
      html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight,
      }).then((canvas) => {
        // Clean up the temporary div
        document.body.removeChild(tempDiv);

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        // Add first page
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Convert to blob
        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Generate contract from application data
export function createContractFromApplication(
  application: any,
  property: any,
  tenant: any,
  landlord: any
): ContractData {
  const contractId = `CNT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  return {
    propertyId: property.id,
    propertyTitle: property.title,
    propertyAddress: property.address,
    propertyCity: property.city,
    propertyArea: Number(property.area),

    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantEmail: tenant.email,
    tenantPhone: tenant.phone || '',
    tenantAddress: tenant.address || '',
    tenantIdNumber: tenant.idNumber || '',

    landlordId: landlord.id,
    landlordName: landlord.name,
    landlordEmail: landlord.email,
    landlordPhone: landlord.phone || '',
    landlordAddress: landlord.address || '',
    landlordIdNumber: landlord.idNumber || '',

    monthlyRent: Number(property.monthlyRent),
    securityDeposit: Number(property.securityDeposit),
    leaseStartDate: new Date(application.moveInDate),
    leaseEndDate: new Date(new Date(application.moveInDate).setMonth(
      new Date(application.moveInDate).getMonth() + application.leaseDuration
    )),
    leaseDuration: application.leaseDuration,

    contractId,
    generatedDate: new Date(),
    platformFee: 50, // Standard platform fee

    utilitiesIncluded: property.utilitiesIncluded || false,
    petsAllowed: property.petsAllowed || false,
    smokingAllowed: property.smokingAllowed || false,
    furnishedType: property.furnished || 'unfurnished',
    specialTerms: [],
  };
}

// Validate contract data
export function validateContractData(contractData: ContractData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields validation
  if (!contractData.propertyTitle) errors.push('Property title is required');
  if (!contractData.tenantName) errors.push('Tenant name is required');
  if (!contractData.landlordName) errors.push('Landlord name is required');
  if (!contractData.monthlyRent || contractData.monthlyRent <= 0) errors.push('Valid monthly rent is required');
  if (!contractData.leaseStartDate) errors.push('Lease start date is required');
  if (!contractData.leaseEndDate) errors.push('Lease end date is required');

  // Date validation
  if (contractData.leaseStartDate && contractData.leaseEndDate) {
    if (contractData.leaseStartDate >= contractData.leaseEndDate) {
      errors.push('Lease start date must be before end date');
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (contractData.tenantEmail && !emailRegex.test(contractData.tenantEmail)) {
    errors.push('Valid tenant email is required');
  }
  if (contractData.landlordEmail && !emailRegex.test(contractData.landlordEmail)) {
    errors.push('Valid landlord email is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
