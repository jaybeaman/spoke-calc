import { useRef, useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import api from '../api/client'
import type { Build } from '../api/types'
import toast from 'react-hot-toast'

export default function BuildSheetPage() {
  const { id } = useParams<{ id: string }>()
  const printRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [customerNotes, setCustomerNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  const { data: build, isLoading, error } = useQuery({
    queryKey: ['build', id],
    queryFn: async () => {
      const res = await api.get<Build>(`/builds/${id}`)
      return res.data
    },
  })

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: build ? `Wheel Build - ${build.customer_name || build.id}` : 'Wheel Build',
  })

  // Sync local state with build data
  useEffect(() => {
    if (build) {
      setCustomerNotes(build.customer_notes || '')
      setInternalNotes(build.internal_notes || '')
      setHasChanges(false)
    }
  }, [build])

  const updateBuildMutation = useMutation({
    mutationFn: async (data: { customer_notes?: string; internal_notes?: string }) => {
      const res = await api.patch<Build>(`/builds/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build', id] })
      setHasChanges(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/builds/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] })
      toast.success('Build deleted')
      navigate('/builds')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete build')
    },
  })

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this build?')) {
      deleteMutation.mutate()
    }
  }

  const handleNotesChange = (field: 'customer' | 'internal', value: string) => {
    if (field === 'customer') {
      setCustomerNotes(value)
      setHasChanges(value !== (build?.customer_notes || '') || internalNotes !== (build?.internal_notes || ''))
    } else {
      setInternalNotes(value)
      setHasChanges(customerNotes !== (build?.customer_notes || '') || value !== (build?.internal_notes || ''))
    }
  }

  const handleSave = () => {
    updateBuildMutation.mutate({
      customer_notes: customerNotes,
      internal_notes: internalNotes,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-scenic-900"></div>
      </div>
    )
  }

  if (error || !build) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-scenic-500 mb-4">Build not found</p>
          <Link to="/builds" className="btn btn-primary">Back to Builds</Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatMeasuredBy = (item: { is_reference: boolean; measured_by: { name: string } | null; measured_at: string | null }) => {
    if (item.is_reference) return 'Reference data'
    if (item.measured_by) {
      const date = item.measured_at ? new Date(item.measured_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
      return `Measured by ${item.measured_by.name}${date ? `, ${date}` : ''}`
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-scenic-100">
      {/* Controls - hidden when printing */}
      <div className="no-print bg-white border-b border-scenic-200 py-4 px-6 flex items-center justify-between">
        <Link to="/builds" className="text-scenic-600 hover:text-scenic-900">
          &larr; Back to Builds
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-sm text-red-600 hover:text-red-800"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Build'}
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={updateBuildMutation.isPending}
              className="btn btn-secondary"
            >
              {updateBuildMutation.isPending ? 'Saving...' : 'Save Notes'}
            </button>
          )}
          <button onClick={() => handlePrint()} className="btn btn-primary">
            Print Build Sheet
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="p-6">
        <div
          ref={printRef}
          className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none"
          style={{ minHeight: '11in' }}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-scenic-900 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Scenic Routes" className="h-16 w-16" />
                <div>
                  <h1 className="text-xl font-bold text-scenic-900">Scenic Routes</h1>
                  <p className="text-sm text-scenic-600">Community Bicycle Center</p>
                  <p className="text-xs text-scenic-500">San Francisco, CA</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-scenic-900">Wheel Build Sheet</h2>
                <p className="text-sm text-scenic-500">{formatDate(build.created_at)}</p>
              </div>
            </div>

            {/* Customer Info */}
            {build.customer_name && (
              <div className="mb-6 p-4 bg-scenic-50 rounded-lg">
                <div className="text-sm text-scenic-500">Customer</div>
                <div className="text-xl font-semibold text-scenic-900">{build.customer_name}</div>
              </div>
            )}

            {/* Spoke Lengths - Main Focus */}
            <div className="mb-8 p-6 bg-scenic-900 text-white rounded-xl">
              <h3 className="text-sm font-medium text-scenic-300 mb-4">SPOKE LENGTHS</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-scenic-400 text-sm">Left / Non-Drive Side</div>
                  <div className="text-5xl font-bold">{build.spoke_length_left}mm</div>
                  <div className="text-scenic-400 text-sm mt-1">{build.cross_pattern_left} cross</div>
                </div>
                <div>
                  <div className="text-scenic-400 text-sm">Right / Drive Side</div>
                  <div className="text-5xl font-bold">{build.spoke_length_right}mm</div>
                  <div className="text-scenic-400 text-sm mt-1">{build.cross_pattern_right} cross</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-scenic-700 text-center">
                <span className="text-scenic-300">{build.spoke_count} spokes total</span>
                <span className="text-scenic-500 mx-2">|</span>
                <span className="text-scenic-300">{build.spoke_count / 2} per side</span>
              </div>
            </div>

            {/* Build Analysis */}
            {build.tension_percent_left && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-scenic-500 mb-3">BUILD ANALYSIS</h3>
                <table className="w-full text-sm border border-scenic-200 rounded-lg overflow-hidden">
                  <thead className="bg-scenic-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-scenic-600"></th>
                      <th className="text-right py-2 px-3 font-medium text-scenic-600">Left / NDS</th>
                      <th className="text-right py-2 px-3 font-medium text-scenic-600">Right / DS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-scenic-100">
                      <td className="py-1.5 px-3 text-scenic-700">Tension Distribution</td>
                      <td className="py-1.5 px-3 text-right">{build.tension_percent_left}%</td>
                      <td className="py-1.5 px-3 text-right">{build.tension_percent_right}%</td>
                    </tr>
                    <tr className="border-t border-scenic-100">
                      <td className="py-1.5 px-3 text-scenic-700">Bracing Angle</td>
                      <td className="py-1.5 px-3 text-right">{build.bracing_angle_left}°</td>
                      <td className="py-1.5 px-3 text-right">{build.bracing_angle_right}°</td>
                    </tr>
                    <tr className="border-t border-scenic-100">
                      <td className="py-1.5 px-3 text-scenic-700">Wrap Angle</td>
                      <td className="py-1.5 px-3 text-right">{build.wrap_angle_left}°</td>
                      <td className="py-1.5 px-3 text-right">{build.wrap_angle_right}°</td>
                    </tr>
                    <tr className="border-t border-scenic-100">
                      <td className="py-1.5 px-3 text-scenic-700">Total Angle at Rim</td>
                      <td className="py-1.5 px-3 text-right">{build.total_angle_left}°</td>
                      <td className="py-1.5 px-3 text-right">{build.total_angle_right}°</td>
                    </tr>
                    <tr className="border-t border-scenic-100">
                      <td className="py-1.5 px-3 text-scenic-700">Theta Angle</td>
                      <td className="py-1.5 px-3 text-right">{build.theta_angle_left}°</td>
                      <td className="py-1.5 px-3 text-right">{build.theta_angle_right}°</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Components */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Rim */}
              <div className="border border-scenic-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-scenic-500 mb-3">RIM</h3>
                <div className="font-semibold text-scenic-900 mb-3">
                  {build.rim.manufacturer} {build.rim.model}
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-scenic-100">
                      <td className="py-1 text-scenic-600">ERD</td>
                      <td className="py-1 text-right font-medium">{build.rim.erd}mm</td>
                    </tr>
                    {build.rim.iso_size && (
                      <tr className="border-b border-scenic-100">
                        <td className="py-1 text-scenic-600">ISO Size</td>
                        <td className="py-1 text-right font-medium">{build.rim.iso_size}</td>
                      </tr>
                    )}
                    <tr className="border-b border-scenic-100">
                      <td className="py-1 text-scenic-600">Drilling Offset</td>
                      <td className="py-1 text-right font-medium">{build.rim.drilling_offset || 0}mm</td>
                    </tr>
                    {build.rim.inner_width && (
                      <tr className="border-b border-scenic-100">
                        <td className="py-1 text-scenic-600">Inner Width</td>
                        <td className="py-1 text-right font-medium">{build.rim.inner_width}mm</td>
                      </tr>
                    )}
                    {build.rim.outer_width && (
                      <tr className="border-b border-scenic-100">
                        <td className="py-1 text-scenic-600">Outer Width</td>
                        <td className="py-1 text-right font-medium">{build.rim.outer_width}mm</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-scenic-400">
                  {formatMeasuredBy(build.rim)}
                </div>
              </div>

              {/* Hub */}
              <div className="border border-scenic-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-scenic-500 mb-3">HUB</h3>
                <div className="font-semibold text-scenic-900 mb-1">
                  {build.hub.manufacturer} {build.hub.model}
                </div>
                {build.hub.position && (
                  <div className="text-sm text-scenic-600 capitalize mb-3">{build.hub.position}</div>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-scenic-200">
                      <th className="py-1 text-left text-scenic-500 font-medium"></th>
                      <th className="py-1 text-right text-scenic-500 font-medium text-xs">Left</th>
                      <th className="py-1 text-right text-scenic-500 font-medium text-xs">Right</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-scenic-100">
                      <td className="py-1 text-scenic-600">Center to Flange</td>
                      <td className="py-1 text-right font-medium">{build.hub.flange_offset_left}mm</td>
                      <td className="py-1 text-right font-medium">{build.hub.flange_offset_right}mm</td>
                    </tr>
                    <tr className="border-b border-scenic-100">
                      <td className="py-1 text-scenic-600">Flange PCD</td>
                      <td className="py-1 text-right font-medium">{build.hub.flange_diameter_left}mm</td>
                      <td className="py-1 text-right font-medium">{build.hub.flange_diameter_right}mm</td>
                    </tr>
                    <tr className="border-b border-scenic-100">
                      <td className="py-1 text-scenic-600">Spoke Hole Dia</td>
                      <td className="py-1 text-right font-medium" colSpan={2}>{build.hub.spoke_hole_diameter || 2.6}mm</td>
                    </tr>
                    {build.hub.spoke_count && (
                      <tr className="border-b border-scenic-100">
                        <td className="py-1 text-scenic-600">Spoke Holes</td>
                        <td className="py-1 text-right font-medium" colSpan={2}>{build.hub.spoke_count}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-scenic-400">
                  {formatMeasuredBy(build.hub)}
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            <div className="mb-6 p-4 border border-scenic-200 rounded-lg">
              <h3 className="text-sm font-medium text-scenic-500 mb-2">Notes</h3>
              <textarea
                value={customerNotes}
                onChange={(e) => handleNotesChange('customer', e.target.value)}
                placeholder="Notes for the customer..."
                className="w-full min-h-20 text-scenic-700 bg-transparent resize-none focus:outline-none print:border-none"
                rows={3}
              />
            </div>

            {/* Internal Notes Section */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-scenic-500 mb-2">Internal Notes</h3>
              <div className="border border-scenic-200 rounded-lg p-4">
                <textarea
                  value={internalNotes}
                  onChange={(e) => handleNotesChange('internal', e.target.value)}
                  placeholder="Internal shop notes..."
                  className="w-full min-h-24 text-scenic-700 bg-transparent resize-none focus:outline-none print:border-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-6 border-t border-scenic-200 flex justify-between items-end text-sm text-scenic-500">
              <div>
                <div>Built by {build.created_by.name}</div>
                <div className="text-xs">Build #{build.id}</div>
              </div>
              <div className="text-right text-xs">
                <div>spokecalc.i.scenicroutes.fm</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
