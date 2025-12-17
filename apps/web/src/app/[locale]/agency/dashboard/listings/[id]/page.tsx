'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, Edit, Save, X, Trash2, DollarSign, 
  Home, MapPin, Bed, Bath, Maximize, Calendar,
  User, Phone, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: string;
  listingType: string;
  marketType: string;
  status: string;
  address: string;
  city: string;
  district?: string;
  bedrooms: number;
  bathrooms?: number;
  area: number;
  floor?: number;
  totalFloors?: number;
  buildingType?: string;
  buildingClass?: string;
  renovation?: string;
  listingSource: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerIsAnonymous: boolean;
  listedBy?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  listingAgency?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Apartment',
  HOUSE: 'House',
  CONDO: 'Condo',
  TOWNHOUSE: 'Townhouse',
  LAND: 'Land',
  COMMERCIAL: 'Commercial',
};

const listingTypeLabels: Record<string, string> = {
  SALE: 'For Sale',
  RENT_LONG: 'For Rent',
  RENT_DAILY: 'Daily Rent',
};

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    price: '',
  });

  const [soldData, setSoldData] = useState({
    soldPrice: '',
    soldDate: new Date().toISOString().split('T')[0],
    buyerName: '',
  });

  useEffect(() => {
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await api.get<Listing>('/agency-crm/listings/' + listingId);
      setListing(response);
      setEditData({
        title: response.title,
        description: response.description,
        price: response.price.toString(),
      });
    } catch (error) {
      console.error('Error fetching listing:', error);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!listing) return;

    try {
      setSaving(true);
      setError('');

      const payload = {
        title: editData.title,
        description: editData.description,
        price: parseFloat(editData.price),
      };

      const response = await api.patch<Listing>('/agency-crm/listings/' + listingId, payload);
      setListing(response);
      setEditing(false);
    } catch (err: any) {
      console.error('Error updating listing:', err);
      setError(err?.response?.data?.message || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSold = async () => {
    try {
      setSaving(true);
      setError('');

      const payload = {
        soldPrice: parseFloat(soldData.soldPrice),
        soldDate: soldData.soldDate,
        buyerName: soldData.buyerName || undefined,
      };

      await api.post('/agency-crm/listings/' + listingId + '/mark-sold', payload);
      setShowSoldModal(false);
      fetchListing();
    } catch (err: any) {
      console.error('Error marking as sold:', err);
      setError(err?.response?.data?.message || 'Failed to mark as sold');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await api.delete('/agency-crm/listings/' + listingId);
      router.push('/agency/dashboard/listings');
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      setError(err?.response?.data?.message || 'Failed to delete listing');
      setSaving(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return currency === 'YE' 
      ? '$' + price.toLocaleString()
      : price.toLocaleString() + ' UZS';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h2>
          <Link href="/agency/dashboard/listings" className="text-blue-600 hover:text-blue-800">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/agency/dashboard/listings"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Listings
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
              <p className="text-gray-600 mt-1">
                Listed {formatDate(listing.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              {listing.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit size={18} />
                    {editing ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setShowSoldModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Mark as Sold
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Status Badge */}
        <div className="mb-6">
          <span className={'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' +
            (listing.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
             listing.status === 'SOLD' ? 'bg-blue-100 text-blue-800' :
             listing.status === 'RENTED' ? 'bg-purple-100 text-purple-800' :
             'bg-gray-100 text-gray-800')
          }>
            {listing.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Editable Section */}
            {editing ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Listing</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ({listing.currency === 'YE' ? 'USD' : 'UZS'})
                    </label>
                    <input
                      type="number"
                      value={editData.price}
                      onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Price */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <DollarSign size={20} />
                    <span className="text-sm font-medium">Price</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(listing.price, listing.currency)}
                  </div>
                  {listing.marketType && (
                    <div className="text-sm text-gray-600 mt-1">
                      {listing.marketType === 'SECONDARY' ? 'Secondary Market' : 'New Building'}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
                </div>

                {/* Property Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Home className="text-gray-400" size={20} />
                      <div>
                        <div className="text-sm text-gray-600">Type</div>
                        <div className="font-medium text-gray-900">
                          {propertyTypeLabels[listing.propertyType] || listing.propertyType}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Bed className="text-gray-400" size={20} />
                      <div>
                        <div className="text-sm text-gray-600">Bedrooms</div>
                        <div className="font-medium text-gray-900">{listing.bedrooms}</div>
                      </div>
                    </div>
                    {listing.bathrooms && (
                      <div className="flex items-center gap-3">
                        <Bath className="text-gray-400" size={20} />
                        <div>
                          <div className="text-sm text-gray-600">Bathrooms</div>
                          <div className="font-medium text-gray-900">{listing.bathrooms}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Maximize className="text-gray-400" size={20} />
                      <div>
                        <div className="text-sm text-gray-600">Area</div>
                        <div className="font-medium text-gray-900">{listing.area} m²</div>
                      </div>
                    </div>
                    {listing.floor && (
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400">📍</div>
                        <div>
                          <div className="text-sm text-gray-600">Floor</div>
                          <div className="font-medium text-gray-900">
                            {listing.floor}{listing.totalFloors && ' / ' + listing.totalFloors}
                          </div>
                        </div>
                      </div>
                    )}
                    {listing.buildingType && (
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400">🏗️</div>
                        <div>
                          <div className="text-sm text-gray-600">Building Type</div>
                          <div className="font-medium text-gray-900">{listing.buildingType}</div>
                        </div>
                      </div>
                    )}
                    {listing.buildingClass && (
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400">⭐</div>
                        <div>
                          <div className="text-sm text-gray-600">Class</div>
                          <div className="font-medium text-gray-900">{listing.buildingClass}</div>
                        </div>
                      </div>
                    )}
                    {listing.renovation && (
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400">🎨</div>
                        <div>
                          <div className="text-sm text-gray-600">Renovation</div>
                          <div className="font-medium text-gray-900">{listing.renovation}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
                  <div className="flex items-start gap-2">
                    <MapPin className="text-gray-400 mt-1" size={20} />
                    <div>
                      <div className="font-medium text-gray-900">{listing.address}</div>
                      <div className="text-gray-600">
                        {listing.district && listing.district + ', '}
                        {listing.city}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h2>
              {listing.ownerName ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="text-gray-400" size={18} />
                    <span className="text-gray-900">{listing.ownerName}</span>
                  </div>
                  {!listing.ownerIsAnonymous && listing.ownerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="text-gray-400" size={18} />
                      <span className="text-gray-900">{listing.ownerPhone}</span>
                    </div>
                  )}
                  {listing.ownerIsAnonymous && (
                    <div className="text-sm text-gray-600 italic">
                      Contact information hidden
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-600">No owner information</div>
              )}
            </div>

            {/* Listing Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Listing Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600">Source</div>
                  <div className="font-medium text-gray-900">
                    {listing.listingSource === 'INDIVIDUAL_OWNER' ? 'Individual Owner' : 'Developer Project'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Listed By</div>
                  <div className="font-medium text-gray-900">
                    {listing.listedBy?.user?.firstName} {listing.listedBy?.user?.lastName}
                  </div>
                </div>
                {listing.listingAgency && (
                  <div>
                    <div className="text-gray-600">Agency</div>
                    <div className="font-medium text-gray-900">
                      {listing.listingAgency.name}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-gray-600">Created</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(listing.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Last Updated</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(listing.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mark as Sold Modal */}
        {showSoldModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mark as Sold</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sold Price ({listing.currency === 'YE' ? 'USD' : 'UZS'}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={soldData.soldPrice}
                    onChange={(e) => setSoldData({ ...soldData, soldPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sold Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={soldData.soldDate}
                    onChange={(e) => setSoldData({ ...soldData, soldDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buyer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={soldData.buyerName}
                    onChange={(e) => setSoldData({ ...soldData, buyerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMarkSold}
                  disabled={saving || !soldData.soldPrice}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Mark as Sold'}
                </button>
                <button
                  onClick={() => setShowSoldModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Listing</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this listing? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
