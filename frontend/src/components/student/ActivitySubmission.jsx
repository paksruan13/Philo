// Complete updated ActivitySubmission.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PhotoUpload from '../common/PhotoUpload';
import { photoService } from '../../services/photoService';

const ActivitySubmission = ({ activityId, onBack }) => {
    const { token } = useAuth();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (activityId) {
            fetchActivity();
        }
    }, [activityId]);

    const fetchActivity = async () => {
        try {
            const response = await fetch(`http://localhost:4243/api/activities/${activityId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if(response.ok) {
                const data = await response.json();
                setActivity(data);
                if(data.submission && data.submission.submissionData) {
                    setFormData(data.submission.submissionData);
                }
            } else {
                setError('Failed to fetch activity details');
            }
        } catch (err) {
            setError('Error loading activity');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const submissionData = {...formData};

            if(formData.photo && formData.photo instanceof File) {
                console.log('Uploading');
                try{
                    const result = await photoService.uploadPhoto(formData.photo);
                    submissionData.photo = result.url;
                    console.log('Uploaded', result.url);
                } catch (error) {
                    console.error('Error uploading photo:', error);
                    setError('Failed to upload photo');
                }
            }

            if(formData.uploadedPhoto && formData.uploadedPhoto instanceof File) {
                console.log('Uploading additional photos');
                try {
                    const result = await photoService.uploadPhoto(formData.uploadedPhoto);
                    submissionData.uploadedPhoto = result.url;
                    console.log('Uploaded additional photo', result.url);
                } catch (error) {
                    console.error('Error uploading additional photo:', error);
                    setError('Failed to upload additional photo');
                }
            }

            const isUpdate = activity.submission && activity.submission.id;
            const url = isUpdate
                ? `http://localhost:4243/api/activities/submission/${activity.submission.id}`
                : `http://localhost:4243/api/activities/${activityId}/submit`;

            const method = isUpdate ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    submissionData: submissionData,
                    notes: formData.notes || ''
                })
            });

            const result = await response.json();
            setSuccess(isUpdate ? 'Submission Updated Successfully' : 'Activity Submitted Successfully');

            setTimeout(() => {
                onBack();
            }, 3000);

        } catch (err) {
            console.error('Error submitting activity:', err);
            setError('Failed to submit activity');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryComponent = () => {
        const categoryName = activity.category?.name?.toLowerCase();
        const canSubmit = !activity.submission || 
            (activity.submission.status === 'REJECTED' || activity.submission.status === 'PENDING');

        if (activity.allowPhotoUpload) {
        return (
            <PhotoUploadCategory
                activity={activity}
                canSubmit={canSubmit}
                onSubmit={handleSubmit}
                formData={formData}
                onInputChange={handleInputChange}
                submitting={submitting}
                error={error}
                success={success}
                onBack={onBack}
            />
        );
    }

    // Check for online purchase activities
    if (activity.allowOnlinePurchase) {
        return (
            <PurchaseCategory
                activity={activity}
                canSubmit={canSubmit}
                onSubmit={handleSubmit}
                formData={formData}
                onInputChange={handleInputChange}
                submitting={submitting}
                error={error}
                success={success}
                onBack={onBack}
            />
        );
    }

    // Check by category name if needed
    switch (activity.categoryType) {
        case 'donation':
            return (
                <DonationCategory
                    activity={activity}
                    canSubmit={canSubmit}
                    onSubmit={handleSubmit}
                    formData={formData}
                    onInputChange={handleInputChange}
                    submitting={submitting}
                    error={error}
                    success={success}
                    onBack={onBack}
                />
            );
        default:
            return (
                <DefaultCategory
                    activity={activity}
                    canSubmit={canSubmit}
                    onSubmit={handleSubmit}
                    formData={formData}
                    onInputChange={handleInputChange}
                    submitting={submitting}
                    error={error}
                    success={success}
                    onBack={onBack}
                />
            );
    }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="text-center text-red-600">Activity not found</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={onBack}
                className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
            >
                ← Back to Dashboard
            </button>

            <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Activity Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">{activity.title}</h1>
                        {activity.category && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                {activity.category.name}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                            {activity.points} Points
                        </span>
                        {activity.createdBy && (
                            <span>Created by {activity.createdBy.name}</span>
                        )}
                    </div>

                    {/* Current Submission Status */}
                    {activity.submission && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Current Submission</h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(activity.submission.status)}`}>
                                    {activity.submission.status}
                                </span>
                            </div>
                            
                            {activity.submission.notes && (
                                <p className="text-gray-600 mt-2">{activity.submission.notes}</p>
                            )}
                            
                            <p className="text-sm text-gray-500 mt-2">
                                Submitted on {new Date(activity.submission.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Category-Specific Component */}
                {getCategoryComponent()}
            </div>
        </div>
    );
};

// Purchase Category Component
const PurchaseCategory = ({ activity, canSubmit, onSubmit, formData, onInputChange, submitting, error, success, onBack }) => {
    const handlePurchaseClick = () => {
        window.open('https://your-school-store.com', '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">🛒 Purchase Activity</h3>
                <div className="text-blue-800 mb-4">
                    <p>{activity.description}</p>
                </div>
                
                {/* Only show purchase button if allowOnlinePurchase is true */}
                {activity.allowOnlinePurchase && (
                    <div className="text-center">
                        <button
                            onClick={handlePurchaseClick}
                            className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            🛒 Purchase Online
                        </button>
                        <p className="text-sm text-blue-600 mt-2">
                            Opens store in new tab. Return here to submit receipt.
                        </p>
                    </div>
                )}

                {/* Show message when online purchase is not available */}
                {!activity.allowOnlinePurchase && (
                    <div className="bg-white p-4 rounded border border-blue-200">
                        <p className="text-sm text-blue-700">
                            <strong>Note:</strong> Online purchasing is not available for today, 
                            Visit us at the table!
                        </p>
                    </div>
                )}
            </div>

            {canSubmit && (
                <form onSubmit={onSubmit} className="space-y-4">

                    {activity.allowPhotoUpload && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Photo (Optional)
                        </label>
                        <PhotoUpload
                            value={formData.uploadedPhoto || ''}
                            onChange={(url) => onInputChange('uploadedPhoto', url)}
                            required={false}
                            submitMode={true}
                        />
                      </div>
                    )}

                    <SubmitSection submitting={submitting} error={error} success={success} onBack={onBack} />
                </form>
            )}

            {!canSubmit && <AlreadySubmittedSection activity={activity} onBack={onBack} />}
        </div>
    );
};

// Donation Category Component
const DonationCategory = ({ activity, canSubmit, onSubmit, formData, onInputChange, submitting, error, success, onBack }) => {
    const handleDonateClick = () => {
        window.open('https://your-donation-platform.com', '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">💰 Donation Activity</h3>
                <div className="text-green-800 mb-4">
                    <p>{activity.description}</p>
                </div>
                
                {/* Only show donation button if allowOnlinePurchase is true */}
                {activity.allowOnlinePurchase && (
                    <div className="text-center">
                        <button
                            onClick={handleDonateClick}
                            className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            💰 Donate Online
                        </button>
                        <p className="text-sm text-green-600 mt-2">
                            Opens donation platform in new tab. Return here to submit confirmation.
                        </p>
                    </div>
                )}

                {/* Show message when online donation is not available */}
                {!activity.allowOnlinePurchase && (
                    <div className="bg-white p-4 rounded border border-green-200">
                        <p className="text-sm text-green-700">
                            <strong>Note:</strong> Online donations are not available.
                            Visit us at the table!
                        </p>
                    </div>
                )}
            </div>

            {canSubmit && (
                <form onSubmit={onSubmit} className="space-y-4">

                    {activity.allowPhotoUpload && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Photo (Optional)
                        </label>
                        <PhotoUpload
                            value={formData.uploadedPhoto || ''}
                            onChange={(url) => onInputChange('uploadedPhoto', url)}
                            required={true}
                            submitMode={true}
                        />
                      </div>
                    )}

                    <SubmitSection submitting={submitting} error={error} success={success} onBack={onBack} />
                </form>
            )}

            {!canSubmit && <AlreadySubmittedSection activity={activity} onBack={onBack} />}
        </div>
    );
};

// Photo Upload Category Component
const PhotoUploadCategory = ({ activity, canSubmit, onSubmit, formData, onInputChange, submitting, error, success, onBack }) => {
    // Track if photo has been selected but not yet uploaded
    const [previewActive, setPreviewActive] = useState(false);
    
    // Handle photo change
    const handlePhotoChange = (file) => {
        onInputChange('photo', file);
        // If it's a File object, we know it's a new selection
        if (file instanceof File) {
            setPreviewActive(true);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">📸 Photo Upload Activity</h3>
                <div className="text-purple-800 mb-4">
                    <p>{activity.description}</p>
                </div>
                
                <div className="bg-white p-4 rounded border border-purple-200">
                    <p className="text-sm text-purple-700">
                        <strong>Note:</strong> Your photo will be reviewed by a coach before points are awarded.
                    </p>
                </div>
            </div>

            {canSubmit && (
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Upload Photo <span className="text-red-500">*</span>
                    </label>
                    
                    {/* File upload UI without preview */}
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required={!formData.photo}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handlePhotoChange(file);
                                }
                            }}
                        />
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-600">Click or drag photo to upload</p>
                            <p className="text-xs text-gray-500">Required</p>
                        </div>
                    </div>
                    
                    {/* Preview area */}
                    {formData.photo && (
                        <div className="mt-4 relative p-2 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium text-gray-700">
                                    {formData.photo instanceof File ? 'Preview:' : 'Current Photo:'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onInputChange('photo', '');
                                        setPreviewActive(false);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <span className="sr-only">Remove</span>
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="relative rounded-lg overflow-hidden bg-white">
                                <img 
                                    src={formData.photo instanceof File ? URL.createObjectURL(formData.photo) : formData.photo}
                                    alt="Photo preview" 
                                    className="max-w-full h-auto max-h-64 object-contain mx-auto"
                                    onLoad={() => { 
                                        if (formData.photo instanceof File) {
                                            URL.revokeObjectURL(formData.photo);
                                        }
                                    }}
                                    onError={(e) => {
                                        console.error("Image failed to load");
                                        e.target.src = "https://via.placeholder.com/400x300?text=Preview+Not+Available";
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Photo Description
                        </label>
                        <textarea
                            value={formData.photoDescription || ''}
                            onChange={(e) => onInputChange('photoDescription', e.target.value)}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Describe what's in the photo..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => onInputChange('notes', e.target.value)}
                            rows={2}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Additional information..."
                        />
                    </div>

                    <SubmitSection submitting={submitting} error={error} success={success} onBack={onBack} />
                </form>
            )}

            {!canSubmit && <AlreadySubmittedSection activity={activity} onBack={onBack} />}
        </div>
    );
};

// Manual Entry Category Component
const ManualEntryCategory = ({ activity, canSubmit, onBack }) => {
    return (
        <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">✋ Manual Entry Activity</h3>
                <div className="text-yellow-800 mb-4">
                    <p>{activity.description}</p>
                </div>
                
                <div className="bg-white p-4 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-700">
                        <strong>Important:</strong> This activity requires physical presence at the organization's table. 
                        Points will be manually awarded by staff when you complete the activity in person.
                    </p>
                </div>
            </div>

            <div className="text-center py-8">
                <div className="mb-4">
                    <span className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-2xl mb-3">
                        📍
                    </span>
                    <p className="text-lg font-semibold text-gray-900">Visit Our Table</p>
                    <p className="text-gray-600">
                        Complete this activity in person to receive your points.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

// Team Challenge Category Component
const TeamChallengeCategory = ({ activity, canSubmit, onBack }) => {
    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">🏆 Team Challenge Activity</h3>
                <div className="text-indigo-800 mb-4">
                    <p>{activity.description}</p>
                </div>
                
                <div className="bg-white p-4 rounded border border-indigo-200">
                    <p className="text-sm text-indigo-700">
                        <strong>Team Activity:</strong> This challenge requires your entire team to participate together 
                        at the organization's location. Points will be awarded to all team members upon completion.
                    </p>
                </div>
            </div>

            <div className="text-center py-8">
                <div className="mb-4">
                    <span className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl mb-3">
                        👥
                    </span>
                    <p className="text-lg font-semibold text-gray-900">Bring Your Team</p>
                    <p className="text-gray-600">
                        This challenge requires in-person team participation.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

// Steal Object Category Component (Future QR Code Implementation)
const StealObjectCategory = ({ activity, canSubmit, onSubmit, formData, onInputChange, submitting, error, success, onBack }) => {
    const [scanningQR, setScanningQR] = useState(false);

    const handleQRScan = () => {
        setScanningQR(true);
        // TODO: Implement QR code scanning
        alert('QR Code scanning will be implemented later!');
        setScanningQR(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-3">🎯 Steal Object Activity</h3>
                <div className="text-red-800 mb-4">
                    <p>{activity.description}</p>
                </div>
                
                <div className="bg-white p-4 rounded border border-red-200">
                    <p className="text-sm text-red-700">
                        <strong>Instructions:</strong> Find the hidden object and scan its QR code to instantly earn points!
                    </p>
                </div>
            </div>

            {canSubmit && (
                <div className="text-center py-8">
                    <div className="mb-6">
                        <span className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-3xl mb-4">
                            📱
                        </span>
                        <p className="text-lg font-semibold text-gray-900 mb-2">Ready to Scan?</p>
                        <p className="text-gray-600 mb-4">
                            Find the hidden object and scan its QR code to earn points instantly.
                        </p>
                    </div>
                    
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={handleQRScan}
                            disabled={scanningQR}
                            className="bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            {scanningQR ? 'Scanning...' : '📱 Scan QR Code'}
                        </button>
                        
                        <button
                            onClick={onBack}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}

            {!canSubmit && <AlreadySubmittedSection activity={activity} onBack={onBack} />}
        </div>
    );
};

// Default Category Component
const DefaultCategory = ({ activity, canSubmit, onSubmit, formData, onInputChange, submitting, error, success, onBack }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 General Activity</h3>
                <div className="text-gray-700 mb-4">
                    <p>{activity.description}</p>
                </div>
            </div>

            {canSubmit && (
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Submission Notes
                        </label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => onInputChange('notes', e.target.value)}
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your submission details..."
                        />
                    </div>

                    <SubmitSection submitting={submitting} error={error} success={success} onBack={onBack} />
                </form>
            )}

            {!canSubmit && <AlreadySubmittedSection activity={activity} onBack={onBack} />}
        </div>
    );
};

// Reusable Submit Section Component
const SubmitSection = ({ submitting, error, success, onBack }) => (
    <div className="space-y-4">
        {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
            </div>
        )}

        {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <p className="text-green-600">{success}</p>
                    <button
                        onClick={onBack}
                        className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                        Return Now
                    </button>
                </div>
                <p className="text-green-500 text-sm mt-2">
                    You'll be automatically redirected in a moment...
                </p>
            </div>
        )}

        {!success && (
            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? 'Submitting...' : 'Submit Activity'}
                </button>
                
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        )}
    </div>
);

// Reusable Already Submitted Section Component
const AlreadySubmittedSection = ({ activity, onBack }) => (
    <div className="text-center py-8">
        <div className="mb-4">
            <span className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl mb-3">
                ✓
            </span>
            <p className="text-lg font-semibold text-gray-900">
                {activity.submission?.status === 'APPROVED' ? 'Activity Completed!' : 'Submission Pending'}
            </p>
            <p className="text-gray-600">
                {activity.submission?.status === 'APPROVED' 
                    ? 'Your submission has been approved and points have been awarded.'
                    : 'Your submission is being reviewed.'}
            </p>
        </div>
        <button
            onClick={onBack}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
            Back to Dashboard
        </button>
    </div>
);

export default ActivitySubmission;