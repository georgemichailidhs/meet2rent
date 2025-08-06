'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Upload,
  X,
  MapPin,
  Euro,
  Home,
  BedDouble,
  Bath,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Plus,
  Minus
} from 'lucide-react';
import Link from 'next/link';
import { PropertyFormData } from '@/lib/types/database';

interface FormErrors {
  [key: string]: string;
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    type: 'apartment',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    floor: undefined,
    totalFloors: undefined,
    yearBuilt: undefined,
    furnished: 'unfurnished',
    monthlyRent: 0,
    securityDeposit: 0,
    utilityDeposit: 0,
    petsAllowed: false,
    smokingAllowed: false,
    minimumStayMonths: 1,
    maximumOccupants: 1,
    amenities: [],
    features: [],
    images: [],
    mainImage: undefined,
    virtualTourUrl: '',
    availableFrom: undefined,
  });

  // Property types
  const propertyTypes = [
    { value: 'apartment', label: 'Apartment', icon: '🏢' },
    { value: 'house', label: 'House', icon: '🏠' },
    { value: 'studio', label: 'Studio', icon: '🏚️' },
    { value: 'loft', label: 'Loft', icon: '🏭' },
  ];

  // Furnished options
  const furnishedOptions = [
    { value: 'furnished', label: 'Fully Furnished' },
    { value: 'semi_furnished', label: 'Semi-Furnished' },
    { value: 'unfurnished', label: 'Unfurnished' },
  ];

  // Available amenities
  const availableAmenities = [
    { id: 'wifi', label: 'WiFi', icon: '📶' },
    { id: 'ac', label: 'Air Conditioning', icon: '❄️' },
    { id: 'heating', label: 'Heating', icon: '🔥' },
    { id: 'parking', label: 'Parking', icon: '🚗' },
    { id: 'balcony', label: 'Balcony', icon: '🌅' },
    { id: 'terrace', label: 'Terrace', icon: '🌿' },
    { id: 'garden', label: 'Garden', icon: '🌳' },
    { id: 'pool', label: 'Swimming Pool', icon: '🏊' },
    { id: 'gym', label: 'Gym', icon: '💪' },
    { id: 'elevator', label: 'Elevator', icon: '🛗' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'doorman', label: 'Doorman', icon: '👨‍💼' },
    { id: 'laundry', label: 'Laundry', icon: '👕' },
    { id: 'dishwasher', label: 'Dishwasher', icon: '🍽️' },
    { id: 'microwave', label: 'Microwave', icon: '🥘' },
    { id: 'oven', label: 'Oven', icon: '🔥' },
    { id: 'fireplace', label: 'Fireplace', icon: '🔥' },
    { id: 'city_view', label: 'City View', icon: '🏙️' },
    { id: 'sea_view', label: 'Sea View', icon: '🌊' },
    { id: 'mountain_view', label: 'Mountain View', icon: '⛰️' },
  ];

  // Greek regions
  const greekRegions = [
    'Attica', 'Central Macedonia', 'Thessaly', 'Central Greece',
    'Western Greece', 'Crete', 'South Aegean', 'North Aegean',
    'Peloponnese', 'Ionian Islands', 'Western Macedonia', 'Eastern Macedonia and Thrace', 'Epirus'
  ];

  // Validation
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: FormErrors = {};

    switch (stepNumber) {
      case 1: // Basic Info
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.type) newErrors.type = 'Property type is required';
        break;

      case 2: // Location
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.region) newErrors.region = 'Region is required';
        break;

      case 3: // Details
        if (formData.bedrooms < 1) newErrors.bedrooms = 'At least 1 bedroom required';
        if (formData.bathrooms < 1) newErrors.bathrooms = 'At least 1 bathroom required';
        if (formData.area <= 0) newErrors.area = 'Area must be greater than 0';
        if (formData.maximumOccupants < 1) newErrors.maximumOccupants = 'At least 1 occupant allowed';
        break;

      case 4: // Pricing
        if (formData.monthlyRent <= 0) newErrors.monthlyRent = 'Monthly rent must be greater than 0';
        if (formData.securityDeposit < 0) newErrors.securityDeposit = 'Security deposit cannot be negative';
        if (formData.minimumStayMonths < 1) newErrors.minimumStayMonths = 'Minimum stay must be at least 1 month';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    const newAmenities = formData.amenities.includes(amenityId)
      ? formData.amenities.filter(id => id !== amenityId)
      : [...formData.amenities, amenityId];
    handleInputChange('amenities', newAmenities);
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploadingImages(true);
    try {
      const formDataUpload = new FormData();
      Array.from(files).forEach(file => {
        formDataUpload.append('images', file);
      });
      formDataUpload.append('propertyId', 'temp-' + Date.now());

      const response = await fetch('/api/upload/property-images', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const result = await response.json();
        const newImages = result.data.files.map((file: any) => file.url);
        handleInputChange('images', [...formData.images, ...newImages]);

        if (!formData.mainImage && newImages.length > 0) {
          handleInputChange('mainImage', newImages[0]);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    const newImages = formData.images.filter(img => img !== imageUrl);
    handleInputChange('images', newImages);

    if (formData.mainImage === imageUrl) {
      handleInputChange('mainImage', newImages[0] || undefined);
    }
  };

  const setMainImage = (imageUrl: string) => {
    handleInputChange('mainImage', imageUrl);
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/dashboard/landlord/properties/${result.data.property.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create property');
      }
    } catch (error) {
      console.error('Property creation error:', error);
      alert('Failed to create property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/landlord/properties" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
          <p className="text-gray-600 mt-2">Create a listing for your rental property</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { number: 1, title: 'Basic Info', icon: Home },
              { number: 2, title: 'Location', icon: MapPin },
              { number: 3, title: 'Details', icon: BedDouble },
              { number: 4, title: 'Pricing', icon: Euro },
              { number: 5, title: 'Photos & Finish', icon: Camera },
            ].map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isCompleted = step > stepItem.number;
              const isCurrent = step === stepItem.number;

              return (
                <div key={stepItem.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                        ? 'border-blue-500 text-blue-500 bg-white'
                        : 'border-gray-300 text-gray-400 bg-white'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {stepItem.title}
                    </p>
                  </div>
                  {index < 4 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Steps */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Basic Property Information</h2>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Modern 2BR Apartment in Kolonaki"
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                      )}
                    </div>

                    {/* Property Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Type *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {propertyTypes.map(type => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange('type', type.value)}
                            className={`p-4 border rounded-lg text-center transition-colors ${
                              formData.type === type.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="text-2xl mb-2">{type.icon}</div>
                            <div className="font-medium">{type.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describe your property, highlighting key features and what makes it special..."
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                      />
                      {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Property Location</h2>

                  <div className="space-y-4">
                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Kolonaki Street 123"
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                      )}
                    </div>

                    {/* City and Region */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Athens"
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                        />
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Region *
                        </label>
                        <select
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.region ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={formData.region}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                        >
                          <option value="">Select Region</option>
                          {greekRegions.map(region => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                        {errors.region && (
                          <p className="text-red-500 text-sm mt-1">{errors.region}</p>
                        )}
                      </div>
                    </div>

                    {/* Postal Code */}
                    <div className="md:w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 10676"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Property Details */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Property Details</h2>

                  <div className="space-y-6">
                    {/* Bedrooms, Bathrooms, Area */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bedrooms *
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleInputChange('bedrooms', Math.max(1, formData.bedrooms - 1))}
                            className="p-2 border rounded-l-lg hover:bg-gray-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            className={`w-full p-2 border-t border-b text-center ${
                              errors.bedrooms ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={formData.bedrooms}
                            onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 1)}
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange('bedrooms', formData.bedrooms + 1)}
                            className="p-2 border rounded-r-lg hover:bg-gray-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {errors.bedrooms && (
                          <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bathrooms *
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleInputChange('bathrooms', Math.max(1, formData.bathrooms - 1))}
                            className="p-2 border rounded-l-lg hover:bg-gray-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            className={`w-full p-2 border-t border-b text-center ${
                              errors.bathrooms ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={formData.bathrooms}
                            onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 1)}
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange('bathrooms', formData.bathrooms + 1)}
                            className="p-2 border rounded-r-lg hover:bg-gray-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {errors.bathrooms && (
                          <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Area (m²) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g., 75"
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.area ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={formData.area || ''}
                          onChange={(e) => handleInputChange('area', parseInt(e.target.value) || 0)}
                        />
                        {errors.area && (
                          <p className="text-red-500 text-sm mt-1">{errors.area}</p>
                        )}
                      </div>
                    </div>

                    {/* Floor Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Floor
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 3"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.floor || ''}
                          onChange={(e) => handleInputChange('floor', parseInt(e.target.value) || undefined)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Floors
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 5"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.totalFloors || ''}
                          onChange={(e) => handleInputChange('totalFloors', parseInt(e.target.value) || undefined)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year Built
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 2015"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.yearBuilt || ''}
                          onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value) || undefined)}
                        />
                      </div>
                    </div>

                    {/* Furnished Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Furnished Status
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {furnishedOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange('furnished', option.value)}
                            className={`p-3 border rounded-lg text-center transition-colors ${
                              formData.furnished === option.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Maximum Occupants */}
                    <div className="md:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Occupants *
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleInputChange('maximumOccupants', Math.max(1, formData.maximumOccupants - 1))}
                          className="p-2 border rounded-l-lg hover:bg-gray-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          className={`w-full p-2 border-t border-b text-center ${
                            errors.maximumOccupants ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={formData.maximumOccupants}
                          onChange={(e) => handleInputChange('maximumOccupants', parseInt(e.target.value) || 1)}
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('maximumOccupants', formData.maximumOccupants + 1)}
                          className="p-2 border rounded-r-lg hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {errors.maximumOccupants && (
                        <p className="text-red-500 text-sm mt-1">{errors.maximumOccupants}</p>
                      )}
                    </div>

                    {/* Pets and Smoking */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Pets Allowed</h4>
                          <p className="text-sm text-gray-600">Allow tenants to have pets</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInputChange('petsAllowed', !formData.petsAllowed)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.petsAllowed ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.petsAllowed ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Smoking Allowed</h4>
                          <p className="text-sm text-gray-600">Allow smoking inside the property</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInputChange('smokingAllowed', !formData.smokingAllowed)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.smokingAllowed ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.smokingAllowed ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Pricing & Terms</h2>

                  <div className="space-y-6">
                    {/* Monthly Rent */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Rent (€) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Euro className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          placeholder="e.g., 1000"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.monthlyRent ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={formData.monthlyRent || ''}
                          onChange={(e) => handleInputChange('monthlyRent', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      {errors.monthlyRent && (
                        <p className="text-red-500 text-sm mt-1">{errors.monthlyRent}</p>
                      )}
                    </div>

                    {/* Security Deposit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Security Deposit (€) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Euro className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          placeholder="e.g., 1000"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.securityDeposit ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={formData.securityDeposit || ''}
                          onChange={(e) => handleInputChange('securityDeposit', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      {errors.securityDeposit && (
                        <p className="text-red-500 text-sm mt-1">{errors.securityDeposit}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Typically 1-2 months' rent
                      </p>
                    </div>

                    {/* Utility Deposit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Utility Deposit (€)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Euro className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          placeholder="e.g., 200"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.utilityDeposit || ''}
                          onChange={(e) => handleInputChange('utilityDeposit', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Optional deposit for utilities (water, electricity, gas)
                      </p>
                    </div>

                    {/* Minimum Stay */}
                    <div className="md:w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Stay (months) *
                      </label>
                      <select
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.minimumStayMonths ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={formData.minimumStayMonths}
                        onChange={(e) => handleInputChange('minimumStayMonths', parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 6, 12, 24].map(months => (
                          <option key={months} value={months}>
                            {months} {months === 1 ? 'month' : 'months'}
                          </option>
                        ))}
                      </select>
                      {errors.minimumStayMonths && (
                        <p className="text-red-500 text-sm mt-1">{errors.minimumStayMonths}</p>
                      )}
                    </div>

                    {/* Available From */}
                    <div className="md:w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available From
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formData.availableFrom ? formData.availableFrom.toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange('availableFrom', e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Photos & Amenities */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Photos & Amenities</h2>

                  <div className="space-y-6">
                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Photos
                      </label>

                      {/* Upload Area */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                          className="hidden"
                          id="image-upload"
                          disabled={uploadingImages}
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          {uploadingImages ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                              <span className="ml-2 text-blue-600">Uploading...</span>
                            </div>
                          ) : (
                            <div>
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Click to upload photos or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, WEBP up to 10MB each (max 20 photos)
                              </p>
                            </div>
                          )}
                        </label>
                      </div>

                      {/* Uploaded Images */}
                      {formData.images.length > 0 && (
                        <div className="mt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {formData.images.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image}
                                  alt={`Property ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />

                                {/* Main Image Badge */}
                                {formData.mainImage === image && (
                                  <div className="absolute top-2 left-2">
                                    <Badge className="bg-blue-600 text-white text-xs">
                                      Main
                                    </Badge>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <div className="flex gap-2">
                                    {formData.mainImage !== image && (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setMainImage(image)}
                                        className="text-xs"
                                      >
                                        Set Main
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => removeImage(image)}
                                      className="p-1"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Amenities */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Amenities & Features
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableAmenities.map(amenity => (
                          <button
                            key={amenity.id}
                            type="button"
                            onClick={() => handleAmenityToggle(amenity.id)}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              formData.amenities.includes(amenity.id)
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{amenity.icon}</span>
                              <span className="text-sm font-medium">{amenity.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Virtual Tour URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Virtual Tour URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formData.virtualTourUrl}
                        onChange={(e) => handleInputChange('virtualTourUrl', e.target.value)}
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Link to 360° photos, video tour, or virtual walkthrough
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <Button onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Property...
                  </>
                ) : (
                  'Create Property'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
