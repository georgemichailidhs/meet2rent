'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Building,
  Euro,
  Calendar,
  Phone,
  Mail,
  PenTool,
  Shield,
  Eye,
  Printer,
  CreditCard
} from 'lucide-react';
import { generateContractHTML, generateRentalContract, type ContractData } from '@/lib/contracts';

// Mock contract data - in real app this would come from API
const mockContractData: ContractData = {
  propertyId: 1,
  propertyTitle: 'Modern 2BR Apartment with City Views',
  propertyAddress: '123 Kolonaki Street',
  propertyCity: 'Athens',
  propertyArea: 75,

  tenantId: 'tenant1',
  tenantName: 'Anna Papadopoulos',
  tenantEmail: 'anna@email.com',
  tenantPhone: '+30 210 555 0101',
  tenantAddress: '456 Previous Address, Athens',
  tenantIdNumber: 'AB123456',

  landlordId: 'landlord1',
  landlordName: 'Maria Konstantinou',
  landlordEmail: 'maria@email.com',
  landlordPhone: '+30 210 555 0201',
  landlordAddress: '789 Landlord Address, Athens',
  landlordIdNumber: 'CD789012',

  monthlyRent: 1000,
  securityDeposit: 1000,
  leaseStartDate: new Date('2024-04-01'),
  leaseEndDate: new Date('2025-04-01'),
  leaseDuration: 12,

  utilitiesIncluded: false,
  petsAllowed: false,
  smokingAllowed: false,
  furnishedType: 'furnished',
  specialTerms: [
    'Internet WiFi included in rent',
    'Cleaning service provided monthly'
  ],

  contractId: 'CNT-2024-001',
  generatedDate: new Date('2024-03-15'),
  platformFee: 50
};

interface Signature {
  contractId: string;
  signerId: string;
  signerName: string;
  signerType: 'tenant' | 'landlord';
  signedAt: Date;
  signature?: string; // base64 signature image
}

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const contractId = params.contractId as string;

  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<'tenant' | 'landlord'>('tenant');
  const [contractHTML, setContractHTML] = useState<string>('');

  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const fetchContractData = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/contracts/${contractId}`);
        if (response.ok) {
          const result = await response.json();
          const contract = result.data.contract;
          const contractSignatures = result.data.signatures;

          // Parse contract data from JSON
          const parsedContractData = JSON.parse(contract.contractData);
          setContractData(parsedContractData);
          setContractHTML(generateContractHTML(parsedContractData));

          // Set signatures
          setSignatures(contractSignatures.map((sig: any) => ({
            contractId: sig.contractId,
            signerId: sig.signerId,
            signerName: sig.signerName,
            signerType: sig.signerType,
            signedAt: new Date(sig.signedAt),
            signature: sig.signatureData,
          })));

          // Determine current user type
          if (session.user.id === contract.tenantId) {
            setCurrentUserType('tenant');
          } else if (session.user.id === contract.landlordId) {
            setCurrentUserType('landlord');
          }
        } else {
          console.error('Failed to fetch contract data');
        }
      } catch (error) {
        console.error('Error fetching contract:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractData();
  }, [contractId, session]);

  const downloadPDF = async () => {
    if (!contractData) return;

    try {
      const pdfBlob = await generateRentalContract(contractData);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rental-contract-${contractData.contractId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const startSigning = () => {
    setShowSignatureModal(true);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !contractData || !session?.user) return;

    const signatureDataURL = canvas.toDataURL();

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sign',
          signatureData: signatureDataURL,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newSignature = result.data.signature;

        // Update local state
        setSignatures(prev => [...prev, {
          contractId: newSignature.contractId,
          signerId: newSignature.signerId,
          signerName: newSignature.signerName,
          signerType: newSignature.signerType,
          signedAt: new Date(newSignature.signedAt),
          signature: newSignature.signatureData,
        }]);

        setShowSignatureModal(false);

        // Show success message
        if (result.data.isFullySigned) {
          alert('Contract signed successfully! The contract is now fully executed and legally binding.');
        } else {
          alert('Your signature has been saved. Waiting for the other party to sign.');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save signature');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Failed to save signature. Please try again.');
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Loading Contract...</h3>
          <p className="text-gray-600">Please wait while we retrieve your contract</p>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Contract Not Found</h1>
            <p className="text-gray-600 mb-6">The contract you're looking for could not be found.</p>
            <Button onClick={() => router.push('/dashboard/tenant')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCurrentUserSigned = signatures.some(
    sig => sig.signerId === session?.user?.id && sig.signerType === currentUserType
  );
  const isOtherPartySigned = signatures.some(
    sig => sig.signerType !== currentUserType
  );
  const isFullySigned = signatures.length >= 2;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rental Contract</h1>
              <p className="text-gray-600 mt-2">Review and sign your rental agreement</p>
            </div>
            <Badge
              variant={isFullySigned ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {isFullySigned ? 'Fully Executed' : 'Pending Signatures'}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Contract Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contract Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Landlord Signature Status */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      signatures.some(s => s.signerType === 'landlord')
                        ? 'bg-green-100'
                        : 'bg-yellow-100'
                    }`}>
                      {signatures.some(s => s.signerType === 'landlord') ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">Landlord Signature</h4>
                      <p className="text-sm text-gray-600">
                        {signatures.some(s => s.signerType === 'landlord')
                          ? `Signed by ${contractData.landlordName}`
                          : 'Pending signature'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Tenant Signature Status */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      signatures.some(s => s.signerType === 'tenant')
                        ? 'bg-green-100'
                        : 'bg-yellow-100'
                    }`}>
                      {signatures.some(s => s.signerType === 'tenant') ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">Tenant Signature</h4>
                      <p className="text-sm text-gray-600">
                        {signatures.some(s => s.signerType === 'tenant')
                          ? `Signed by ${contractData.tenantName}`
                          : 'Pending signature'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contract Preview</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={downloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="border rounded-lg p-6 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: contractHTML }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Contract ID</div>
                  <div className="font-mono text-sm">{contractData.contractId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Generated</div>
                  <div className="text-sm">{contractData.generatedDate.toLocaleDateString('en-GB')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Property</div>
                  <div className="text-sm font-medium">{contractData.propertyTitle}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Monthly Rent</div>
                  <div className="text-lg font-bold text-green-600">€{contractData.monthlyRent}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Lease Period</div>
                  <div className="text-sm">
                    {contractData.leaseStartDate.toLocaleDateString('en-GB')} - {' '}
                    {contractData.leaseEndDate.toLocaleDateString('en-GB')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signature Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Digital Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isCurrentUserSigned ? (
                  <>
                    <p className="text-sm text-gray-600">
                      By signing this contract, you agree to all terms and conditions outlined above.
                    </p>
                    <div className="space-y-3">
                      <Link href={`/payment/${contractData.propertyId}?type=monthly_rent&amount=${contractData.monthlyRent}&contract_id=${contractData.contractId}`}>
                        <Button className="w-full">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay First Month&apos;s Rent (€{contractData.monthlyRent})
                        </Button>
                      </Link>
                      <Button onClick={startSigning} variant="outline" className="w-full">
                        <PenTool className="h-4 w-4 mr-2" />
                        Sign Contract
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-green-700">You have signed this contract</p>
                    <p className="text-sm text-gray-600">
                      Signed on {signatures.find(s => s.signerId === session?.user?.id)?.signedAt.toLocaleDateString('en-GB')}
                    </p>
                  </div>
                )}

                {isFullySigned && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800 text-center">
                      ✅ Contract is fully executed and legally binding
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Secure & Legal</h4>
                    <p className="text-sm text-blue-700">
                      Digital signatures are legally binding under Greek and EU law.
                      All signatures are timestamped and cryptographically secured.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Questions about this contract? Contact our legal support team.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Support
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Legal Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Signature Modal */}
        {showSignatureModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Digital Signature</CardTitle>
                <p className="text-gray-600">
                  Please sign below to execute this rental contract
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Signature Canvas */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Sign here:</p>
                  <canvas
                    ref={signatureCanvasRef}
                    width={600}
                    height={200}
                    className="border border-gray-300 rounded cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    style={{ touchAction: 'none' }}
                  />
                </div>

                {/* Legal Notice */}
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Legal Notice</h4>
                      <p className="text-sm text-yellow-700">
                        By signing this contract, you acknowledge that you have read,
                        understood, and agree to be legally bound by all terms and conditions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSignatureModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearSignature}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={saveSignature}
                    className="flex-1"
                  >
                    Sign Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
