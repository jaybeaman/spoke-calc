import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Hub } from '../api/types'
import toast from 'react-hot-toast'

export default function HubsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingHub, setEditingHub] = useState<Hub | null>(null)

  const { data: hubs = [], isLoading } = useQuery({
    queryKey: ['hubs', search],
    queryFn: async () => {
      const res = await api.get<Hub[]>('/hubs', {
        params: { search: search || undefined, limit: 200 }
      })
      return res.data
    },
  })

  const formatMeasuredBy = (hub: Hub) => {
    if (hub.is_reference) return 'Reference'
    if (hub.measured_by) {
      const date = hub.measured_at ? new Date(hub.measured_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
      return `${hub.measured_by.name}${date ? ` (${date})` : ''}`
    }
    return '-'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-scenic-900">Hubs</h2>
          <p className="text-scenic-500">Manage hub database</p>
        </div>
        <button
          onClick={() => { setEditingHub(null); setShowForm(true) }}
          className="btn btn-primary"
        >
          Add Hub
        </button>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search by manufacturer or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input mb-4"
        />

        {isLoading ? (
          <div className="text-center py-8 text-scenic-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-scenic-200">
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">Manufacturer</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">Model</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">Position</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">PCD L</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">PCD R</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">Offset L</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">Offset R</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">Source</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600"></th>
                </tr>
              </thead>
              <tbody>
                {hubs.map((hub) => (
                  <tr key={hub.id} className="border-b border-scenic-100 hover:bg-scenic-50">
                    <td className="py-3 px-2 font-medium">{hub.manufacturer}</td>
                    <td className="py-3 px-2">{hub.model}</td>
                    <td className="py-3 px-2 capitalize">{hub.position || '-'}</td>
                    <td className="py-3 px-2">{hub.flange_diameter_left}mm</td>
                    <td className="py-3 px-2">{hub.flange_diameter_right}mm</td>
                    <td className="py-3 px-2">{hub.flange_offset_left}mm</td>
                    <td className="py-3 px-2">{hub.flange_offset_right}mm</td>
                    <td className="py-3 px-2 text-scenic-500 text-xs">{formatMeasuredBy(hub)}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => { setEditingHub(hub); setShowForm(true) }}
                        className="text-scenic-600 hover:text-scenic-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hubs.length === 0 && (
              <div className="text-center py-8 text-scenic-500">No hubs found</div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <HubForm
          hub={editingHub}
          onClose={() => { setShowForm(false); setEditingHub(null) }}
          onSuccess={() => {
            setShowForm(false)
            setEditingHub(null)
            queryClient.invalidateQueries({ queryKey: ['hubs'] })
          }}
        />
      )}
    </div>
  )
}

function HubForm({ hub, onClose, onSuccess }: { hub: Hub | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    manufacturer: hub?.manufacturer || '',
    model: hub?.model || '',
    position: hub?.position || '',
    oln: hub?.oln?.toString() || '',
    axle_type: hub?.axle_type || '',
    brake_type: hub?.brake_type || '',
    drive_interface: hub?.drive_interface || '',
    flange_diameter_left: hub?.flange_diameter_left?.toString() || '',
    flange_diameter_right: hub?.flange_diameter_right?.toString() || '',
    flange_offset_left: hub?.flange_offset_left?.toString() || '',
    flange_offset_right: hub?.flange_offset_right?.toString() || '',
    spoke_hole_diameter: hub?.spoke_hole_diameter?.toString() || '2.6',
    spoke_count: hub?.spoke_count?.toString() || '',
    spoke_interface: hub?.spoke_interface || '',
    weight: hub?.weight?.toString() || '',
    notes: hub?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        manufacturer: formData.manufacturer,
        model: formData.model,
        position: formData.position || null,
        oln: formData.oln ? Number(formData.oln) : null,
        axle_type: formData.axle_type || null,
        brake_type: formData.brake_type || null,
        drive_interface: formData.drive_interface || null,
        flange_diameter_left: Number(formData.flange_diameter_left),
        flange_diameter_right: Number(formData.flange_diameter_right),
        flange_offset_left: Number(formData.flange_offset_left),
        flange_offset_right: Number(formData.flange_offset_right),
        spoke_hole_diameter: formData.spoke_hole_diameter ? Number(formData.spoke_hole_diameter) : 2.6,
        spoke_count: formData.spoke_count ? Number(formData.spoke_count) : null,
        spoke_interface: formData.spoke_interface || null,
        weight: formData.weight ? Number(formData.weight) : null,
        notes: formData.notes || null,
      }

      if (hub) {
        await api.put(`/hubs/${hub.id}`, data)
      } else {
        await api.post('/hubs', data)
      }
    },
    onSuccess: () => {
      toast.success(hub ? 'Hub updated!' : 'Hub added!')
      onSuccess()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to save hub')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.manufacturer || !formData.model || !formData.flange_diameter_left || !formData.flange_offset_left) {
      toast.error('Manufacturer, model, and flange measurements are required')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-scenic-200">
          <h3 className="text-xl font-bold text-scenic-900">
            {hub ? 'Edit Hub' : 'Add Hub'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Manufacturer *</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="input"
              >
                <option value="">-</option>
                <option value="front">Front</option>
                <option value="rear">Rear</option>
              </select>
            </div>
            <div>
              <label className="label">Spoke Count</label>
              <input
                type="number"
                value={formData.spoke_count}
                onChange={(e) => setFormData({ ...formData, spoke_count: e.target.value })}
                className="input"
                placeholder="32"
              />
            </div>
            <div>
              <label className="label">OLN (mm)</label>
              <input
                type="number"
                value={formData.oln}
                onChange={(e) => setFormData({ ...formData, oln: e.target.value })}
                className="input"
                placeholder="130"
              />
            </div>
          </div>

          <div className="bg-scenic-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-scenic-900">Flange Measurements *</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Left PCD (mm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.flange_diameter_left}
                  onChange={(e) => setFormData({ ...formData, flange_diameter_left: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Right PCD (mm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.flange_diameter_right}
                  onChange={(e) => setFormData({ ...formData, flange_diameter_right: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Left Offset (mm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.flange_offset_left}
                  onChange={(e) => setFormData({ ...formData, flange_offset_left: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Right Offset (mm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.flange_offset_right}
                  onChange={(e) => setFormData({ ...formData, flange_offset_right: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Spoke Hole Diameter (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.spoke_hole_diameter}
                  onChange={(e) => setFormData({ ...formData, spoke_hole_diameter: e.target.value })}
                  className="input"
                  placeholder="2.6"
                />
              </div>
              <div>
                <label className="label">Spoke Interface</label>
                <select
                  value={formData.spoke_interface}
                  onChange={(e) => setFormData({ ...formData, spoke_interface: e.target.value })}
                  className="input"
                >
                  <option value="">-</option>
                  <option value="j-bend">J-Bend</option>
                  <option value="straight-pull">Straight Pull</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Axle Type</label>
              <select
                value={formData.axle_type}
                onChange={(e) => setFormData({ ...formData, axle_type: e.target.value })}
                className="input"
              >
                <option value="">-</option>
                <option value="QR">QR</option>
                <option value="12mm thru">12mm Thru</option>
                <option value="15mm thru">15mm Thru</option>
                <option value="bolt-on">Bolt-On</option>
              </select>
            </div>
            <div>
              <label className="label">Brake Type</label>
              <select
                value={formData.brake_type}
                onChange={(e) => setFormData({ ...formData, brake_type: e.target.value })}
                className="input"
              >
                <option value="">-</option>
                <option value="rim">Rim Brake</option>
                <option value="disc-6bolt">Disc 6-Bolt</option>
                <option value="centerlock">Centerlock</option>
                <option value="coaster">Coaster</option>
                <option value="drum">Drum</option>
              </select>
            </div>
            <div>
              <label className="label">Weight (g)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary">
              {mutation.isPending ? 'Saving...' : 'Save Hub'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
