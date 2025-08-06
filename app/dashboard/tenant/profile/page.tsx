'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Camera,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Euro,
  Briefcase,
  GraduationCap,
  Users,
  Home,
  Shield,
  Clock,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';
import { ProfileFormData, UserDocument } from '@/lib/types/database';

interface VerificationDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: Date;
  rejectionReason?: string;
}

interface TenantProfile {
  id: string;
  category: string;
  occupation: string;
  monthlyIncome: number;
  bio: string;
  isProfileComplete: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  preferences: {
    locations: string[];
    minPrice: number;
    maxPrice: number;
    propertyTypes: string[];
    amenities: string[];
  };
  documents: VerificationDocument[];
}

export default function TenantProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'preferences' | 'verification'>('profile');

  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    phone: '',
    dateOfBirth: undefined,
    category: 'professional',
    occupation: '',
    monthlyIncome: 0,
    bio: '',
    preferences: {
      locations: [],
      minPrice: 0,
      maxPrice: 5000,
      propertyTypes: [],
      amenities: [],
    },
  });

  // Profile categories
  const profileCategories = [
    { value: 'student', label: 'Student', icon: '🎓', description: 'University or college student' },
    { value: 'professional', label: 'Professional', icon: '💼', description: 'Working professional' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', description: 'Family with children' },
    { value: 'senior', label: 'Senior', icon: '👴', description: 'Senior citizen (65+)' },
  ];

  // Document types
  const documentTypes = [
    { value: 'id_card', label: 'ID Card / Passport', required: true, icon: '🆔' },
    { value: 'income_proof', label: 'Income Proof', required: true, icon: '💰' },
    { value: 'employment_letter', label: 'Employment Letter', required: false, icon: '📝' },
    { value: 'bank_statement', label: 'Bank Statement', required: false, icon: '🏦' },
  ];

  // Property types
  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'studio', label: 'Studio' },
    { value: 'loft', label: 'Loft' },
  ];

  // Available amenities
  const availableAmenities = [
    { id: 'wifi', label: 'WiFi' },
    { id: 'ac', label: 'Air Conditioning' },
    { id: 'heating', label: 'Heating' },
    { id: 'parking', label: 'Parking' },
    { id: 'balcony', label: 'Balcony' },
    { id: 'elevator', label: 'Elevator' },
    { id: 'gym', label: 'Gym' },
    { id: 'pool', label: 'Swimming Pool' },
  ];

  // Greek cities
  const greekCities = [
    'Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa',
    'Volos', 'Ioannina', 'Kavala', 'Chania', 'Rhodes'
  ];

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
      }));
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      // TODO: Fetch profile from API
      // For now, use mock data
      const mockProfile: TenantProfile = {
        id: '1',
        category: 'professional',
        occupation: 'Software Engineer',
        monthlyIncome: 3500,
        bio: 'I am a clean, responsible professional looking for a comfortable place to live.',
        isProfileComplete: false,
        verificationStatus: 'pending',
        preferences: {
          locations: ['Athens', 'Thessaloniki'],
          minPrice: 800,
          maxPrice: 1500,
          propertyTypes: ['apartment', 'studio'],
          amenities: ['wifi', 'ac', 'elevator'],
        },
        documents: [
          {
            id: '1',
            type: 'id_card',
            fileName: 'passport.pdf',
            fileUrl: '/documents/passport.pdf',
            status: 'verified',
            uploadedAt: new Date('2024-01-15'),
          },
          {
            id: '2',
            type: 'income_proof',
            fileName: 'payslip.pdf',
            fileUrl: '/documents/payslip.pdf',
            status: 'pending',
            uploadedAt: new Date('2024-01-20'),
          },
        ],
      };

      setProfile(mockProfile);
      setFormData({
        name: session?.user?.name || '',
        phone: session?.user?.phone || '',
        category: mockProfile.category,
        occupation: mockProfile.occupation,
        monthlyIncome: mockProfile.monthlyIncome,
        bio: mockProfile.bio,
        preferences: mockProfile.preferences,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: keyof ProfileFormData['preferences'], value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences!,
        [field]: value,
      },
    }));
  };

  const addPreferenceItem = (field: 'locations' | 'propertyTypes' | 'amenities', value: string) => {
    if (!formData.preferences![field].includes(value)) {
      handlePreferenceChange(field, [...formData.preferences![field], value]);
    }
  };

  const removePreferenceItem = (field: 'locations' | 'propertyTypes' | 'amenities', value: string) => {
    handlePreferenceChange(field, formData.preferences![field].filter(item => item !== value));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // TODO: Save profile to API
      console.log('Saving profile:', formData);

      // Update session if name changed
      if (formData.name !== session?.user?.name) {
        await update({ name: formData.name });
      }

      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (documentType: string, files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', files[0]);
      formData.append('documentType', documentType);

      const response = await fetch('/api/upload/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Document uploaded:', result);

        // Refresh profile to show new document
        await fetchProfile();
        alert('Document uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentStatus = (type: string) => {
    const doc = profile?.documents.find(d => d.type === type);
    return doc ? doc.status : 'missing';
  };

  const getVerificationProgress = () => {
    if (!profile) return 0;

    const requiredFields = ['category', 'occupation', 'monthlyIncome'];
    const completedFields = requiredFields.filter(field => {
      if (field === 'monthlyIncome') return profile.monthlyIncome > 0;
      return (profile as any)[field];
    });

    const requiredDocs = documentTypes.filter(doc => doc.required);
    const completedDocs = requiredDocs.filter(doc =>
      profile.documents.some(d => d.type === doc.value && d.status !== 'rejected')
    );

    const totalRequired = requiredFields.length + requiredDocs.length;
    const totalCompleted = completedFields.length + completedDocs.length;

    return Math.round((totalCompleted / totalRequired) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Loading Profile...</h3>
          <p className="text-gray-600">Please wait while we retrieve your information</p>
        </div>
      </div>
    );
  }

  const verificationProgress = getVerificationProgress();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tenant Profile</h1>
          <p className="text-gray-600 mt-2">Complete your profile to start applying for properties</p>
        </div>

        {/* Verification Status */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Profile Completion</h3>
                <p className="text-gray-600">Complete your profile to improve your chances of approval</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{verificationProgress}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${verificationProgress}%` }}
              ></div>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant={profile?.verificationStatus === 'verified' ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                {profile?.verificationStatus === 'verified' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {profile?.verificationStatus === 'verified' ? 'Verified' : 'Pending Verification'}
              </Badge>

              {verificationProgress === 100 && (
                <Badge className="bg-green-100 text-green-800">
                  Ready to Apply
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 border">
          {[
            { id: 'profile', label: 'Basic Info', icon: User },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'preferences', label: 'Preferences', icon: Home },
            { id: 'verification', label: 'Verification', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Basic Info Tab */}
          {activeTab === 'profile' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="+30 XXX XXX XXXX"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.dateOfBirth?.toISOString().split('T')[0] || ''}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Income (€) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="e.g., 2500"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.monthlyIncome || ''}
                          onChange={(e) => handleInputChange('monthlyIncome', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Occupation *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Software Engineer"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.occupation}
                          onChange={(e) => handleInputChange('occupation', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio / About Me
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Tell landlords about yourself, your lifestyle, and what kind of tenant you are..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tenant Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileCategories.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => handleInputChange('category', category.value)}
                          className={`p-4 border rounded-lg text-left transition-colors ${
                            formData.category === category.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{category.icon}</span>
                            <span className="font-semibold">{category.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                          {session?.user?.image ? (
                            <img
                              src={session.user.image}
                              alt="Profile"
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-10 w-10 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-semibold">{formData.name || 'Your Name'}</h3>
                        <p className="text-sm text-gray-600">{formData.occupation || 'Your Occupation'}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category</span>
                          <span className="capitalize">{formData.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Income</span>
                          <span>€{formData.monthlyIncome || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone</span>
                          <span>{formData.phone || 'Not provided'}</span>
                        </div>
                      </div>

                      {formData.bio && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-gray-700">{formData.bio}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveProfile} className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Documents</CardTitle>
                  <p className="text-gray-600">Upload the required documents to verify your identity and income</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {documentTypes.map((docType) => {
                      const status = getDocumentStatus(docType.value);
                      const document = profile?.documents.find(d => d.type === docType.value);

                      return (
                        <div key={docType.value} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{docType.icon}</span>
                              <div>
                                <h4 className="font-semibold">{docType.label}</h4>
                                {docType.required && (
                                  <Badge variant="outline" className="text-xs">Required</Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {status === 'verified' && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {status === 'pending' && (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {status === 'rejected' && (
                                <Badge variant="destructive">
                                  <X className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                              )}
                              {status === 'missing' && (
                                <Badge variant="outline">
                                  <Upload className="h-3 w-3 mr-1" />
                                  Upload Needed
                                </Badge>
                              )}
                            </div>
                          </div>

                          {document && (
                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium">{document.fileName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploaded on {document.uploadedAt.toLocaleDateString()}
                              </p>
                              {document.status === 'rejected' && document.rejectionReason && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                  <strong>Rejection Reason:</strong> {document.rejectionReason}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => e.target.files && handleDocumentUpload(docType.value, e.target.files)}
                              className="hidden"
                              id={`upload-${docType.value}`}
                              disabled={uploading}
                            />
                            <label
                              htmlFor={`upload-${docType.value}`}
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              {uploading ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              {document ? 'Replace Document' : 'Upload Document'}
                            </label>
                            <span className="text-sm text-gray-500">
                              PDF, JPG, PNG (max 5MB)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Preferences</CardTitle>
                  <p className="text-gray-600">Tell us what you're looking for to get better property recommendations</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Locations
                    </label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {formData.preferences?.locations.map((location) => (
                          <Badge key={location} className="flex items-center gap-1">
                            {location}
                            <button
                              onClick={() => removePreferenceItem('locations', location)}
                              className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addPreferenceItem('locations', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full md:w-64 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Add a location...</option>
                        {greekCities.filter(city => !formData.preferences?.locations.includes(city)).map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Price Range (€/month)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.preferences?.minPrice || 0}
                          onChange={(e) => handlePreferenceChange('minPrice', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.preferences?.maxPrice || 5000}
                          onChange={(e) => handlePreferenceChange('maxPrice', parseInt(e.target.value) || 5000)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Property Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Property Types
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {propertyTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => {
                            if (formData.preferences?.propertyTypes.includes(type.value)) {
                              removePreferenceItem('propertyTypes', type.value);
                            } else {
                              addPreferenceItem('propertyTypes', type.value);
                            }
                          }}
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            formData.preferences?.propertyTypes.includes(type.value)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Amenities
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableAmenities.map((amenity) => (
                        <button
                          key={amenity.id}
                          onClick={() => {
                            if (formData.preferences?.amenities.includes(amenity.id)) {
                              removePreferenceItem('amenities', amenity.id);
                            } else {
                              addPreferenceItem('amenities', amenity.id);
                            }
                          }}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            formData.preferences?.amenities.includes(amenity.id)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-sm">{amenity.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                  <p className="text-gray-600">Track your verification progress and status</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Overall Status */}
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
                        {profile?.verificationStatus === 'verified' ? (
                          <CheckCircle className="h-10 w-10 text-green-600" />
                        ) : profile?.verificationStatus === 'rejected' ? (
                          <X className="h-10 w-10 text-red-600" />
                        ) : (
                          <Clock className="h-10 w-10 text-yellow-600" />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {profile?.verificationStatus === 'verified' && 'Verification Complete'}
                        {profile?.verificationStatus === 'pending' && 'Verification In Progress'}
                        {profile?.verificationStatus === 'rejected' && 'Verification Issues'}
                      </h3>
                      <p className="text-gray-600">
                        {profile?.verificationStatus === 'verified' && 'Your profile is fully verified and ready for applications.'}
                        {profile?.verificationStatus === 'pending' && 'We are reviewing your documents and information.'}
                        {profile?.verificationStatus === 'rejected' && 'Please address the issues below and resubmit.'}
                      </p>
                    </div>

                    {/* Verification Checklist */}
                    <div>
                      <h4 className="font-semibold mb-4">Verification Checklist</h4>
                      <div className="space-y-3">
                        {/* Profile Completion */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className={`h-5 w-5 ${formData.name && formData.occupation && formData.monthlyIncome ? 'text-green-600' : 'text-gray-300'}`} />
                            <span className="font-medium">Basic Profile Information</span>
                          </div>
                          <Badge variant={formData.name && formData.occupation && formData.monthlyIncome ? 'default' : 'secondary'}>
                            {formData.name && formData.occupation && formData.monthlyIncome ? 'Complete' : 'Incomplete'}
                          </Badge>
                        </div>

                        {/* Document Verification */}
                        {documentTypes.filter(doc => doc.required).map((docType) => {
                          const status = getDocumentStatus(docType.value);
                          return (
                            <div key={docType.value} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <CheckCircle className={`h-5 w-5 ${status === 'verified' ? 'text-green-600' : 'text-gray-300'}`} />
                                <span className="font-medium">{docType.label}</span>
                              </div>
                              <Badge variant={
                                status === 'verified' ? 'default' :
                                status === 'pending' ? 'secondary' :
                                status === 'rejected' ? 'destructive' : 'outline'
                              }>
                                {status === 'verified' && 'Verified'}
                                {status === 'pending' && 'Under Review'}
                                {status === 'rejected' && 'Rejected'}
                                {status === 'missing' && 'Not Uploaded'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Next Steps */}
                    {verificationProgress < 100 && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {!formData.name && <li>• Complete your basic profile information</li>}
                            {!formData.occupation && <li>• Add your occupation details</li>}
                            {!formData.monthlyIncome && <li>• Provide your monthly income</li>}
                            {documentTypes.filter(doc => doc.required && getDocumentStatus(doc.value) === 'missing').map(doc => (
                              <li key={doc.value}>• Upload your {doc.label.toLowerCase()}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
