import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Rim } from '../api/types'
import toast from 'react-hot-toast'

export default function RimsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRim, setEditingRim] = useState<Rim | null>(null)

  const { data: rims = [], isLoading } = useQuery({
    queryKey: ['rims', search],
    queryFn: async () => {
      const res = await api.get<Rim[]>('/rims', {
        params: { search: search || undefined, limit: 200 }
      })
      return res.data
    },
  })

  const formatMeasuredBy = (rim: Rim) => {
    if (rim.is_reference) return 'Reference'
    if (rim.measured_by) {
      const date = rim.measured_at ? new Date(rim.measured_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
      return `${rim.measured_by.name}${date ? ` (${date})` : ''}`
    }
    return '-'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-scenic-900">Rims</h2>
          <p className="text-scenic-500">Manage rim database</p>
        </div>
        <button
          onClick={() => { setEditingRim(null); setShowForm(true) }}
          className="btn btn-primary"
        >
          Add Rim
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
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">ERD</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">ISO</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">Width</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600">Source</th>
                  <th className="text-left py-3 px-2 font-medium text-scenic-600"></th>
                </tr>
              </thead>
              <tbody>
                {rims.map((rim) => (
                  <tr key={rim.id} className="border-b border-scenic-100 hover:bg-scenic-50">
                    <td className="py-3 px-2 font-medium">{rim.manufacturer}</td>
                    <td className="py-3 px-2">{rim.model}</td>
                    <td className="py-3 px-2">{rim.erd}mm</td>
                    <td className="py-3 px-2">{rim.iso_size || '-'}</td>
                    <td className="py-3 px-2">{rim.inner_width ? `${rim.inner_width}mm` : '-'}</td>
                    <td className="py-3 px-2 text-scenic-500 text-xs">{formatMeasuredBy(rim)}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => { setEditingRim(rim); setShowForm(true) }}
                        className="text-scenic-600 hover:text-scenic-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rims.length === 0 && (
              <div className="text-center py-8 text-scenic-500">No rims found</div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <RimForm
          rim={editingRim}
          onClose={() => { setShowForm(false); setEditingRim(null) }}
          onSuccess={() => {
            setShowForm(false)
            setEditingRim(null)
            queryClient.invalidateQueries({ queryKey: ['rims'] })
          }}
        />
      )}
    </div>
  )
}

function RimForm({ rim, onClose, onSuccess }: { rim: Rim | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    manufacturer: rim?.manufacturer || '',
    model: rim?.model || '',
    iso_size: rim?.iso_size?.toString() || '',
    erd: rim?.erd?.toString() || '',
    drilling_offset: rim?.drilling_offset?.toString() || '0',
    outer_width: rim?.outer_width?.toString() || '',
    inner_width: rim?.inner_width?.toString() || '',
    height: rim?.height?.toString() || '',
    weight: rim?.weight?.toString() || '',
    joint_type: rim?.joint_type || '',
    eyelet_type: rim?.eyelet_type || '',
    tire_type: rim?.tire_type || '',
    notes: rim?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        manufacturer: formData.manufacturer,
        model: formData.model,
        iso_size: formData.iso_size ? Number(formData.iso_size) : null,
        erd: Number(formData.erd),
        drilling_offset: formData.drilling_offset ? Number(formData.drilling_offset) : 0,
        outer_width: formData.outer_width ? Number(formData.outer_width) : null,
        inner_width: formData.inner_width ? Number(formData.inner_width) : null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        joint_type: formData.joint_type || null,
        eyelet_type: formData.eyelet_type || null,
        tire_type: formData.tire_type || null,
        notes: formData.notes || null,
      }

      if (rim) {
        await api.put(`/rims/${rim.id}`, data)
      } else {
        await api.post('/rims', data)
      }
    },
    onSuccess: () => {
      toast.success(rim ? 'Rim updated!' : 'Rim added!')
      onSuccess()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to save rim')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.manufacturer || !formData.model || !formData.erd) {
      toast.error('Manufacturer, model, and ERD are required')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-scenic-200">
          <h3 className="text-xl font-bold text-scenic-900">
            {rim ? 'Edit Rim' : 'Add Rim'}
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
              <label className="label">ERD (mm) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.erd}
                onChange={(e) => setFormData({ ...formData, erd: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">ISO Size</label>
              <input
                type="number"
                value={formData.iso_size}
                onChange={(e) => setFormData({ ...formData, iso_size: e.target.value })}
                className="input"
                placeholder="622"
              />
            </div>
            <div>
              <label className="label">Drilling Offset (mm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.drilling_offset}
                onChange={(e) => setFormData({ ...formData, drilling_offset: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="label">Outer Width</label>
              <input
                type="number"
                step="0.1"
                value={formData.outer_width}
                onChange={(e) => setFormData({ ...formData, outer_width: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Inner Width</label>
              <input
                type="number"
                step="0.1"
                value={formData.inner_width}
                onChange={(e) => setFormData({ ...formData, inner_width: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Height</label>
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="input"
              />
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Joint Type</label>
              <select
                value={formData.joint_type}
                onChange={(e) => setFormData({ ...formData, joint_type: e.target.value })}
                className="input"
              >
                <option value="">-</option>
                <option value="pinned">Pinned</option>
                <option value="welded">Welded</option>
                <option value="seamless">Seamless</option>
                <option value="sleeved">Sleeved</option>
              </select>
            </div>
            <div>
              <label className="label">Eyelet Type</label>
              <select
                value={formData.eyelet_type}
                onChange={(e) => setFormData({ ...formData, eyelet_type: e.target.value })}
                className="input"
              >
                <option value="">-</option>
                <option value="none">None</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
              </select>
            </div>
            <div>
              <label className="label">Tire Type</label>
              <select
                value={formData.tire_type}
                onChange={(e) => setFormData({ ...formData, tire_type: e.target.value })}
                className="input"
              >
                <option value="">-</option>
                <option value="clincher">Clincher</option>
                <option value="tubeless">Tubeless</option>
                <option value="tubular">Tubular</option>
              </select>
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
              {mutation.isPending ? 'Saving...' : 'Save Rim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
