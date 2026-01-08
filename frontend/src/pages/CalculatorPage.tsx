import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import type { Rim, Hub, SpokeResult } from '../api/types'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

export default function CalculatorPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedRim, setSelectedRim] = useState<Rim | null>(null)
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null)
  const [spokeCount, setSpokeCount] = useState(32)
  const [crossLeft, setCrossLeft] = useState(3)
  const [crossRight, setCrossRight] = useState(3)
  const [rimSearch, setRimSearch] = useState('')
  const [hubSearch, setHubSearch] = useState('')
  const [result, setResult] = useState<SpokeResult | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [adjustedErd, setAdjustedErd] = useState<string>('')
  const [showErdAdjust, setShowErdAdjust] = useState(false)

  // Fetch rims
  const { data: rims = [] } = useQuery({
    queryKey: ['rims', rimSearch],
    queryFn: async () => {
      const res = await api.get<Rim[]>('/rims', {
        params: { search: rimSearch || undefined, limit: 50 }
      })
      return res.data
    },
  })

  // Fetch hubs
  const { data: hubs = [] } = useQuery({
    queryKey: ['hubs', hubSearch],
    queryFn: async () => {
      const res = await api.get<Hub[]>('/hubs', {
        params: { search: hubSearch || undefined, limit: 50 }
      })
      return res.data
    },
  })

  // Calculate spoke lengths
  const calculateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRim || !selectedHub) throw new Error('Select rim and hub')
      const res = await api.post<SpokeResult>('/calculate', {
        erd: selectedRim.erd,
        rim_offset: selectedRim.drilling_offset || 0,
        flange_diameter_left: selectedHub.flange_diameter_left,
        flange_diameter_right: selectedHub.flange_diameter_right,
        flange_offset_left: selectedHub.flange_offset_left,
        flange_offset_right: selectedHub.flange_offset_right,
        spoke_hole_diameter: selectedHub.spoke_hole_diameter || 2.6,
        spoke_count: spokeCount,
        cross_pattern_left: crossLeft,
        cross_pattern_right: crossRight,
      })
      return res.data
    },
    onSuccess: (data) => {
      setResult(data)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Calculation failed')
    },
  })

  // Save build
  const saveBuildMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRim || !selectedHub || !result) throw new Error('Missing data')
      const res = await api.post('/builds', {
        rim_id: selectedRim.id,
        hub_id: selectedHub.id,
        spoke_count: spokeCount,
        cross_pattern_left: crossLeft,
        cross_pattern_right: crossRight,
        spoke_length_left: result.spoke_length_left_rounded,
        spoke_length_right: result.spoke_length_right_rounded,
        tension_percent_left: result.tension_percent_left,
        tension_percent_right: result.tension_percent_right,
        bracing_angle_left: result.bracing_angle_left,
        bracing_angle_right: result.bracing_angle_right,
        wrap_angle_left: result.wrap_angle_left,
        wrap_angle_right: result.wrap_angle_right,
        total_angle_left: result.total_angle_left,
        total_angle_right: result.total_angle_right,
        theta_angle_left: result.theta_angle_left,
        theta_angle_right: result.theta_angle_right,
        customer_name: customerName || null,
        customer_notes: customerNotes || null,
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Build saved!')
      navigate(`/build/${data.id}/print`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to save build')
    },
  })

  // Create rim variant with adjusted ERD
  const createRimVariantMutation = useMutation({
    mutationFn: async (newErd: number) => {
      if (!selectedRim) throw new Error('No rim selected')
      const now = new Date()
      const monthYear = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const variantModel = `${selectedRim.model} (${newErd} - ${user?.name}, ${monthYear})`

      const res = await api.post<Rim>('/rims', {
        manufacturer: selectedRim.manufacturer,
        model: variantModel,
        erd: newErd,
        iso_size: selectedRim.iso_size,
        drilling_offset: selectedRim.drilling_offset,
        inner_width: selectedRim.inner_width,
        outer_width: selectedRim.outer_width,
        is_reference: false,
      })
      return res.data
    },
    onSuccess: (newRim) => {
      queryClient.invalidateQueries({ queryKey: ['rims'] })
      setSelectedRim(newRim)
      setShowErdAdjust(false)
      setAdjustedErd('')
      toast.success(`Created rim variant with ERD ${newRim.erd}mm`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create rim variant')
    },
  })

  const handleCreateErdVariant = () => {
    const erd = parseFloat(adjustedErd)
    if (isNaN(erd) || erd <= 0) {
      toast.error('Please enter a valid ERD')
      return
    }
    createRimVariantMutation.mutate(erd)
  }

  const formatMeasuredBy = (item: Rim | Hub) => {
    if (item.is_reference) return 'Reference data'
    if (item.measured_by) {
      const date = item.measured_at ? new Date(item.measured_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
      return `Measured by ${item.measured_by.name}${date ? `, ${date}` : ''}`
    }
    return ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-scenic-900 dark:text-scenic-100">Spoke Calculator</h2>
        <p className="text-scenic-500 dark:text-scenic-400">Calculate spoke lengths for your wheel build</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rim Selection */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-scenic-900 dark:text-scenic-100">Select Rim</h3>
            <Link to="/rims" className="text-sm text-scenic-600 hover:text-scenic-900 dark:text-scenic-400 dark:hover:text-scenic-200">+ Add Rim</Link>
          </div>
          <input
            type="text"
            placeholder="Search rims..."
            value={rimSearch}
            onChange={(e) => setRimSearch(e.target.value)}
            className="input mb-3"
          />
          <div className="max-h-64 overflow-y-auto border border-scenic-200 dark:border-scenic-600 rounded-lg">
            {rims.map((rim) => (
              <button
                key={rim.id}
                onClick={() => setSelectedRim(rim)}
                className={`w-full text-left px-4 py-3 border-b border-scenic-100 dark:border-scenic-700 last:border-b-0 hover:bg-scenic-50 dark:hover:bg-scenic-700 transition-colors ${
                  selectedRim?.id === rim.id ? 'bg-scenic-100 dark:bg-scenic-700' : ''
                }`}
              >
                <div className="font-medium text-scenic-900 dark:text-scenic-100">
                  {rim.manufacturer} {rim.model}
                </div>
                <div className="text-sm text-scenic-500 dark:text-scenic-400">
                  ERD: {rim.erd}mm | {rim.iso_size || '?'}
                  {rim.inner_width && ` | ${rim.inner_width}mm inner`}
                </div>
                <div className="text-xs text-scenic-400 dark:text-scenic-500 mt-1">
                  {formatMeasuredBy(rim)}
                </div>
              </button>
            ))}
            {rims.length === 0 && (
              <div className="px-4 py-8 text-center text-scenic-500 dark:text-scenic-400">
                No rims found
              </div>
            )}
          </div>
          {selectedRim && (
            <div className="mt-3 p-3 bg-scenic-50 dark:bg-scenic-700 rounded-lg">
              <div className="font-medium mb-2 dark:text-scenic-100">{selectedRim.manufacturer} {selectedRim.model}</div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-scenic-200 dark:border-scenic-600">
                    <td className="py-1 text-scenic-600 dark:text-scenic-300">ERD</td>
                    <td className="py-1 text-right font-medium dark:text-scenic-100">
                      {selectedRim.erd}mm
                      {!showErdAdjust && (
                        <button
                          onClick={() => {
                            setShowErdAdjust(true)
                            setAdjustedErd(selectedRim.erd.toString())
                          }}
                          className="ml-2 text-xs text-scenic-500 hover:text-scenic-700 dark:text-scenic-400 dark:hover:text-scenic-200"
                        >
                          adjust
                        </button>
                      )}
                    </td>
                  </tr>
                  {showErdAdjust && (
                    <tr className="border-b border-scenic-200 dark:border-scenic-600 bg-white dark:bg-scenic-800">
                      <td className="py-2 text-scenic-600 dark:text-scenic-300">New ERD</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={adjustedErd}
                            onChange={(e) => setAdjustedErd(e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-scenic-300 dark:border-scenic-600 dark:bg-scenic-700 dark:text-scenic-100 rounded"
                            placeholder="ERD"
                          />
                          <span className="text-sm dark:text-scenic-300">mm</span>
                          <button
                            onClick={handleCreateErdVariant}
                            disabled={createRimVariantMutation.isPending}
                            className="px-2 py-1 text-xs bg-scenic-900 text-white rounded hover:bg-scenic-800 dark:bg-scenic-100 dark:text-scenic-900 dark:hover:bg-scenic-200"
                          >
                            {createRimVariantMutation.isPending ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setShowErdAdjust(false)
                              setAdjustedErd('')
                            }}
                            className="px-2 py-1 text-xs text-scenic-500 hover:text-scenic-700 dark:text-scenic-400 dark:hover:text-scenic-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedRim.iso_size && (
                    <tr className="border-b border-scenic-200 dark:border-scenic-600">
                      <td className="py-1 text-scenic-600 dark:text-scenic-300">ISO Size</td>
                      <td className="py-1 text-right font-medium dark:text-scenic-100">{selectedRim.iso_size}</td>
                    </tr>
                  )}
                  <tr className="border-b border-scenic-200 dark:border-scenic-600">
                    <td className="py-1 text-scenic-600 dark:text-scenic-300">Drilling Offset</td>
                    <td className="py-1 text-right font-medium dark:text-scenic-100">{selectedRim.drilling_offset || 0}mm</td>
                  </tr>
                  {selectedRim.inner_width && (
                    <tr className="border-b border-scenic-200 dark:border-scenic-600">
                      <td className="py-1 text-scenic-600 dark:text-scenic-300">Inner Width</td>
                      <td className="py-1 text-right font-medium dark:text-scenic-100">{selectedRim.inner_width}mm</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-2 text-xs text-scenic-400 dark:text-scenic-500">{formatMeasuredBy(selectedRim)}</div>
            </div>
          )}
        </div>

        {/* Hub Selection */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-scenic-900 dark:text-scenic-100">Select Hub</h3>
            <Link to="/hubs" className="text-sm text-scenic-600 hover:text-scenic-900 dark:text-scenic-400 dark:hover:text-scenic-200">+ Add Hub</Link>
          </div>
          <input
            type="text"
            placeholder="Search hubs..."
            value={hubSearch}
            onChange={(e) => setHubSearch(e.target.value)}
            className="input mb-3"
          />
          <div className="max-h-64 overflow-y-auto border border-scenic-200 dark:border-scenic-600 rounded-lg">
            {hubs.map((hub) => (
              <button
                key={hub.id}
                onClick={() => {
                  setSelectedHub(hub)
                  if (hub.spoke_count) setSpokeCount(hub.spoke_count)
                }}
                className={`w-full text-left px-4 py-3 border-b border-scenic-100 dark:border-scenic-700 last:border-b-0 hover:bg-scenic-50 dark:hover:bg-scenic-700 transition-colors ${
                  selectedHub?.id === hub.id ? 'bg-scenic-100 dark:bg-scenic-700' : ''
                }`}
              >
                <div className="font-medium text-scenic-900 dark:text-scenic-100">
                  {hub.manufacturer} {hub.model}
                </div>
                <div className="text-sm text-scenic-500 dark:text-scenic-400">
                  {hub.position && `${hub.position} | `}
                  PCD: {hub.flange_diameter_left}mm
                  {hub.spoke_count && ` | ${hub.spoke_count}h`}
                </div>
                <div className="text-xs text-scenic-400 dark:text-scenic-500 mt-1">
                  {formatMeasuredBy(hub)}
                </div>
              </button>
            ))}
            {hubs.length === 0 && (
              <div className="px-4 py-8 text-center text-scenic-500 dark:text-scenic-400">
                No hubs found
              </div>
            )}
          </div>
          {selectedHub && (
            <div className="mt-3 p-3 bg-scenic-50 dark:bg-scenic-700 rounded-lg">
              <div className="font-medium mb-1 dark:text-scenic-100">{selectedHub.manufacturer} {selectedHub.model}</div>
              {selectedHub.position && (
                <div className="text-sm text-scenic-600 dark:text-scenic-300 capitalize mb-2">{selectedHub.position}</div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-scenic-300 dark:border-scenic-500">
                    <th className="py-1 text-left text-scenic-500 dark:text-scenic-400 font-medium"></th>
                    <th className="py-1 text-right text-scenic-500 dark:text-scenic-400 font-medium text-xs">Left</th>
                    <th className="py-1 text-right text-scenic-500 dark:text-scenic-400 font-medium text-xs">Right</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-scenic-200 dark:border-scenic-600">
                    <td className="py-1 text-scenic-600 dark:text-scenic-300">Center to Flange</td>
                    <td className="py-1 text-right font-medium dark:text-scenic-100">{selectedHub.flange_offset_left}mm</td>
                    <td className="py-1 text-right font-medium dark:text-scenic-100">{selectedHub.flange_offset_right}mm</td>
                  </tr>
                  <tr className="border-b border-scenic-200 dark:border-scenic-600">
                    <td className="py-1 text-scenic-600 dark:text-scenic-300">Flange PCD</td>
                    <td className="py-1 text-right font-medium dark:text-scenic-100">{selectedHub.flange_diameter_left}mm</td>
                    <td className="py-1 text-right font-medium dark:text-scenic-100">{selectedHub.flange_diameter_right}mm</td>
                  </tr>
                  <tr className="border-b border-scenic-200 dark:border-scenic-600">
                    <td className="py-1 text-scenic-600 dark:text-scenic-300">Spoke Hole Dia</td>
                    <td className="py-1 text-right font-medium dark:text-scenic-100" colSpan={2}>{selectedHub.spoke_hole_diameter || 2.6}mm</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2 text-xs text-scenic-400 dark:text-scenic-500">{formatMeasuredBy(selectedHub)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Build Parameters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-scenic-900 dark:text-scenic-100 mb-4">Build Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Spoke Count</label>
            <select
              value={spokeCount}
              onChange={(e) => setSpokeCount(Number(e.target.value))}
              className="input"
            >
              {[16, 20, 24, 28, 32, 36, 40, 48].map((n) => (
                <option key={n} value={n}>{n} spokes</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cross Pattern (Left/NDS)</label>
            <select
              value={crossLeft}
              onChange={(e) => setCrossLeft(Number(e.target.value))}
              className="input"
            >
              <option value={0}>Radial (0x)</option>
              <option value={1}>1 cross</option>
              <option value={2}>2 cross</option>
              <option value={3}>3 cross</option>
              <option value={4}>4 cross</option>
            </select>
          </div>
          <div>
            <label className="label">Cross Pattern (Right/DS)</label>
            <select
              value={crossRight}
              onChange={(e) => setCrossRight(Number(e.target.value))}
              className="input"
            >
              <option value={0}>Radial (0x)</option>
              <option value={1}>1 cross</option>
              <option value={2}>2 cross</option>
              <option value={3}>3 cross</option>
              <option value={4}>4 cross</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => calculateMutation.mutate()}
          disabled={!selectedRim || !selectedHub || calculateMutation.isPending}
          className="mt-6 btn btn-primary w-full sm:w-auto"
        >
          {calculateMutation.isPending ? 'Calculating...' : 'Calculate Spoke Lengths'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Spoke Lengths */}
          <div className="card bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900">
            <h3 className="text-lg font-semibold mb-4">Spoke Lengths</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-scenic-300 dark:text-scenic-600 text-sm">Left / Non-Drive Side</div>
                <div className="text-4xl font-bold">{result.spoke_length_left_rounded}mm</div>
                <div className="text-scenic-400 dark:text-scenic-500 text-sm">Exact: {result.spoke_length_left}mm</div>
              </div>
              <div>
                <div className="text-scenic-300 dark:text-scenic-600 text-sm">Right / Drive Side</div>
                <div className="text-4xl font-bold">{result.spoke_length_right_rounded}mm</div>
                <div className="text-scenic-400 dark:text-scenic-500 text-sm">Exact: {result.spoke_length_right}mm</div>
              </div>
            </div>
          </div>

          {/* Analysis Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-scenic-900 dark:text-scenic-100 mb-4">Build Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-scenic-200 dark:border-scenic-600">
                    <th className="text-left py-2 px-3 font-medium text-scenic-600 dark:text-scenic-300"></th>
                    <th className="text-right py-2 px-3 font-medium text-scenic-600 dark:text-scenic-300">Left / NDS</th>
                    <th className="text-right py-2 px-3 font-medium text-scenic-600 dark:text-scenic-300">Right / DS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-scenic-100 dark:border-scenic-700">
                    <td className="py-2 px-3 text-scenic-700 dark:text-scenic-300">Spoke Length</td>
                    <td className="py-2 px-3 text-right font-semibold dark:text-scenic-100">{result.spoke_length_left_rounded}mm</td>
                    <td className="py-2 px-3 text-right font-semibold dark:text-scenic-100">{result.spoke_length_right_rounded}mm</td>
                  </tr>
                  <tr className="border-b border-scenic-100 dark:border-scenic-700">
                    <td className="py-2 px-3 text-scenic-700 dark:text-scenic-300">Tension Distribution</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.tension_percent_left}%</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.tension_percent_right}%</td>
                  </tr>
                  <tr className="border-b border-scenic-100 dark:border-scenic-700">
                    <td className="py-2 px-3 text-scenic-700 dark:text-scenic-300">Bracing Angle</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.bracing_angle_left}°</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.bracing_angle_right}°</td>
                  </tr>
                  <tr className="border-b border-scenic-100 dark:border-scenic-700">
                    <td className="py-2 px-3 text-scenic-700 dark:text-scenic-300">Wrap Angle (at rim)</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.wrap_angle_left}°</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.wrap_angle_right}°</td>
                  </tr>
                  <tr className="border-b border-scenic-100 dark:border-scenic-700">
                    <td className="py-2 px-3 text-scenic-700 dark:text-scenic-300">Total Angle at Rim</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.total_angle_left}°</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.total_angle_right}°</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-scenic-700 dark:text-scenic-300">Theta Angle</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.theta_angle_left}°</td>
                    <td className="py-2 px-3 text-right dark:text-scenic-100">{result.theta_angle_right}°</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Build */}
          <div className="card">
            <h3 className="text-lg font-semibold text-scenic-900 dark:text-scenic-100 mb-4">Save Build & Print Sheet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Customer Name (optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="label">Notes for Customer (optional)</label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="input"
                  placeholder="Break-in instructions, etc."
                />
              </div>
            </div>
            <button
              onClick={() => saveBuildMutation.mutate()}
              disabled={saveBuildMutation.isPending}
              className="btn btn-primary"
            >
              {saveBuildMutation.isPending ? 'Saving...' : 'Save Build & Print'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
