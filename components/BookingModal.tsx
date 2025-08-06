'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Calendar,
  Clock,
  MessageSquare,
  User,
  Euro,
  FileText,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Home,
  MapPin,
  Loader2,
  Send,
  Upload,
  Eye,
  Plus,
  Minus,
} from 'lucide-react';
import { PropertyWithDetails, BookingFormData, ApplicationFormData } from '@/lib/types/database';

interface BookingModalProps {
  property: PropertyWithDetails;
  isOpen: boolean;
  onClose: () => void;
  type: 'viewing' | 'application';
}

interface FormErrors {
  [key: string]: string;
}

export default function BookingModal({ property, isOpen, onClose, type }: BookingModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<ApplicationFormData>({
    propertyId: property.id,
    type: type,
    viewingDate: undefined,
    viewingTime: '',
    moveInDate: undefined,
    leaseDuration: property.minimumStayMonths,
    message: '',
    monthlyIncome: undefined,
    hasGuarantor: false,
    guarantorInfo: undefined,
    previousRentalHistory: [],
    references: [],
    coverLetter: '',
    additionalInfo: '',
  });

  // Available viewing times
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ];

  const handleInputChange = (field: keyof ApplicationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: FormErrors = {};

    if (type === 'viewing') {
      if (stepNumber === 1) {
        if (!formData.viewingDate) newErrors.viewingDate = 'Please select a viewing date';
        if (!formData.viewingTime) newErrors.viewingTime = 'Please select a viewing time';
      }
    } else { // application
      if (stepNumber === 1) {
        if (!formData.moveInDate) newErrors.moveInDate = 'Please select your preferred move-in date';
        if (!formData.leaseDuration || formData.leaseDuration < property.minimumStayMonths) {
          newErrors.leaseDuration = `Minimum lease duration is ${property.minimumStayMonths} months`;
        }
      }
      if (stepNumber === 2) {
        if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
          newErrors.monthlyIncome = 'Monthly income is required';
        }
        if (formData.monthlyIncome && formData.monthlyIncome < Number(property.monthlyRent) * 2.5) {
          newErrors.monthlyIncome = 'Income should be at least 2.5x the monthly rent';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const addRentalHistory = () => {
    const newHistory = {
      address: '',
      landlordName: '',
      landlordContact: '',
      rentAmount: 0,
      duration: '',
      reason: '',
    };
    handleInputChange('previousRentalHistory', [...(formData.previousRentalHistory || []), newHistory]);
  };

  const updateRentalHistory = (index: number, field: string, value: any) => {
    const updated = [...(formData.previousRentalHistory || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleInputChange('previousRentalHistory', updated);
  };

  const removeRentalHistory = (index: number) => {
    const updated = (formData.previousRentalHistory || []).filter((_, i) => i !== index);
    handleInputChange('previousRentalHistory', updated);
  };

  const addReference = () => {
    const newReference = {
      name: '',
      relationship: '',
      contact: '',
    };
    handleInputChange('references', [...(formData.references || []), newReference]);
  };

  const updateReference = (index: number, field: string, value: string) => {
    const updated = [...(formData.references || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleInputChange('references', updated);
  };

  const removeReference = (index: number) => {
    const updated = (formData.references || []).filter((_, i) => i !== index);
    handleInputChange('references', updated);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Booking submitted:', result);

        // Show success message
        alert(type === 'viewing'
          ? 'Viewing request submitted successfully! The landlord will contact you soon.'
          : 'Application submitted successfully! The landlord will review your application.'
        );

        onClose();
      } else {
        const error = await response.json();
        alert(error.error || `Failed to submit ${type} request`);
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert(`Failed to submit ${type} request. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxSteps = () => {
    if (type === 'viewing') return 2; // Date/Time + Message
    return 4; // Details + Income + History + Review
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {type === 'viewing' ? 'Schedule Property Viewing' : 'Apply to Rent Property'}
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">{property.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center mt-4">
            {Array.from({ length: getMaxSteps() }, (_, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > index + 1
                    ? 'bg-green-500 text-white'
                    : step === index + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > index + 1 ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                {index < getMaxSteps() - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-600 mt-2">
            Step {step} of {getMaxSteps()}: {
              type === 'viewing'
                ? step === 1 ? 'Select Date & Time' : 'Add Message'
                : step === 1 ? 'Rental Details'
                  : step === 2 ? 'Financial Information'
                  : step === 3 ? 'Rental History & References'
                  : 'Review & Submit'
            }
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {/* VIEWING: Step 1 - Date & Time Selection */}
          {type === 'viewing' && step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  min={getMinDate()}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.viewingDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.viewingDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleInputChange('viewingDate', e.target.value ? new Date(e.target.value) : undefined)}
                />
                {errors.viewingDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.viewingDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleInputChange('viewingTime', time)}
                      className={`p-2 text-sm border rounded-lg transition-colors ${
                        formData.viewingTime === time
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                {errors.viewingTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.viewingTime}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Viewing Guidelines</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Viewings typically last 15-30 minutes</li>
                      <li>• Please arrive on time</li>
                      <li>• Feel free to ask questions about the property</li>
                      <li>• The landlord will confirm the appointment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEWING: Step 2 - Message */}
          {type === 'viewing' && step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Landlord (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Introduce yourself and mention any specific questions about the property..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.message || ''}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Your Contact Information</h4>
                <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{session?.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{session?.user?.email}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    The landlord will use this information to contact you about the viewing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATION: Step 1 - Rental Details */}
          {type === 'application' && step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Move-in Date *
                  </label>
                  <input
                    type="date"
                    min={getMinDate()}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.moveInDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.moveInDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleInputChange('moveInDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                  {errors.moveInDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.moveInDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lease Duration (months) *
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleInputChange('leaseDuration', Math.max(property.minimumStayMonths, (formData.leaseDuration || property.minimumStayMonths) - 1))}
                      className="p-2 border rounded-l-lg hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={property.minimumStayMonths}
                      className={`w-full p-2 border-t border-b text-center ${
                        errors.leaseDuration ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.leaseDuration || property.minimumStayMonths}
                      onChange={(e) => handleInputChange('leaseDuration', parseInt(e.target.value) || property.minimumStayMonths)}
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('leaseDuration', (formData.leaseDuration || property.minimumStayMonths) + 1)}
                      className="p-2 border rounded-r-lg hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.leaseDuration && (
                    <p className="text-red-500 text-sm mt-1">{errors.leaseDuration}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Minimum: {property.minimumStayMonths} months
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter *
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell the landlord about yourself, why you're interested in this property, and what kind of tenant you are..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.coverLetter || ''}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                />
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Cost Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly Rent</span>
                    <span>€{property.monthlyRent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Deposit</span>
                    <span>€{property.securityDeposit}</span>
                  </div>
                  {property.utilityDeposit && Number(property.utilityDeposit) > 0 && (
                    <div className="flex justify-between">
                      <span>Utility Deposit</span>
                      <span>€{property.utilityDeposit}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 font-semibold flex justify-between">
                    <span>Total Initial Cost</span>
                    <span>€{Number(property.monthlyRent) + Number(property.securityDeposit) + Number(property.utilityDeposit || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATION: Step 2 - Financial Information */}
          {type === 'application' && step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Income (€) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g., 2500"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.monthlyIncome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.monthlyIncome || ''}
                  onChange={(e) => handleInputChange('monthlyIncome', parseInt(e.target.value) || undefined)}
                />
                {errors.monthlyIncome && (
                  <p className="text-red-500 text-sm mt-1">{errors.monthlyIncome}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Recommended: at least €{Number(property.monthlyRent) * 2.5} (2.5x rent)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Do you have a guarantor?
                  </label>
                  <button
                    type="button"
                    onClick={() => handleInputChange('hasGuarantor', !formData.hasGuarantor)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.hasGuarantor ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.hasGuarantor ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {formData.hasGuarantor && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Guarantor Name
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={formData.guarantorInfo?.name || ''}
                        onChange={(e) => handleInputChange('guarantorInfo', {
                          ...formData.guarantorInfo,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={formData.guarantorInfo?.email || ''}
                        onChange={(e) => handleInputChange('guarantorInfo', {
                          ...formData.guarantorInfo,
                          email: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={formData.guarantorInfo?.phone || ''}
                        onChange={(e) => handleInputChange('guarantorInfo', {
                          ...formData.guarantorInfo,
                          phone: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Relationship
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Parent, Sibling"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={formData.guarantorInfo?.relationship || ''}
                        onChange={(e) => handleInputChange('guarantorInfo', {
                          ...formData.guarantorInfo,
                          relationship: e.target.value
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APPLICATION: Step 3 - Rental History & References */}
          {type === 'application' && step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Previous Rental History
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={addRentalHistory}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {formData.previousRentalHistory && formData.previousRentalHistory.length > 0 ? (
                  <div className="space-y-3">
                    {formData.previousRentalHistory.map((history, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Rental #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRentalHistory(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Property Address"
                            className="w-full p-2 border rounded text-sm"
                            value={history.address}
                            onChange={(e) => updateRentalHistory(index, 'address', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Landlord Name"
                            className="w-full p-2 border rounded text-sm"
                            value={history.landlordName}
                            onChange={(e) => updateRentalHistory(index, 'landlordName', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Landlord Contact"
                            className="w-full p-2 border rounded text-sm"
                            value={history.landlordContact}
                            onChange={(e) => updateRentalHistory(index, 'landlordContact', e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="Monthly Rent (€)"
                            className="w-full p-2 border rounded text-sm"
                            value={history.rentAmount || ''}
                            onChange={(e) => updateRentalHistory(index, 'rentAmount', parseInt(e.target.value) || 0)}
                          />
                          <input
                            type="text"
                            placeholder="Duration (e.g., 2 years)"
                            className="w-full p-2 border rounded text-sm"
                            value={history.duration}
                            onChange={(e) => updateRentalHistory(index, 'duration', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Reason for leaving"
                            className="w-full p-2 border rounded text-sm"
                            value={history.reason}
                            onChange={(e) => updateRentalHistory(index, 'reason', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4 border border-dashed rounded-lg">
                    No rental history added. Click "Add" to include previous rental experience.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    References
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={addReference}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {formData.references && formData.references.length > 0 ? (
                  <div className="space-y-3">
                    {formData.references.map((reference, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Reference #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeReference(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full p-2 border rounded text-sm"
                            value={reference.name}
                            onChange={(e) => updateReference(index, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Relationship (e.g., Previous Landlord)"
                            className="w-full p-2 border rounded text-sm"
                            value={reference.relationship}
                            onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Contact (phone/email)"
                            className="w-full p-2 border rounded text-sm"
                            value={reference.contact}
                            onChange={(e) => updateReference(index, 'contact', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4 border border-dashed rounded-lg">
                    No references added. Click "Add" to include character or professional references.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  rows={3}
                  placeholder="Any additional information you'd like to share..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.additionalInfo || ''}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* APPLICATION: Step 4 - Review & Submit */}
          {type === 'application' && step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Review Your Application</h3>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Rental Details</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Move-in Date:</strong> {formData.moveInDate?.toLocaleDateString()}</p>
                      <p><strong>Lease Duration:</strong> {formData.leaseDuration} months</p>
                      <p><strong>Monthly Rent:</strong> €{property.monthlyRent}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Financial Information</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Monthly Income:</strong> €{formData.monthlyIncome}</p>
                      <p><strong>Income to Rent Ratio:</strong> {formData.monthlyIncome ? (formData.monthlyIncome / Number(property.monthlyRent)).toFixed(1) : 'N/A'}x</p>
                      <p><strong>Guarantor:</strong> {formData.hasGuarantor ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {formData.coverLetter && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Cover Letter</h4>
                      <p className="text-sm text-gray-700">{formData.coverLetter}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Next Steps</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Your application will be sent to the landlord</li>
                      <li>• You'll receive confirmation via email</li>
                      <li>• The landlord will review and respond within 3-5 business days</li>
                      <li>• If approved, you'll receive next steps for signing the lease</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-6">
          <div className="flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>

              {step < getMaxSteps() ? (
                <Button onClick={nextStep}>
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit {type === 'viewing' ? 'Viewing Request' : 'Application'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
