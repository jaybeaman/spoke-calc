import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/client'
import type { Build } from '../api/types'
import toast from 'react-hot-toast'

export default function BuildsPage() {
  const queryClient = useQueryClient()

  const { data: builds = [], isLoading } = useQuery({
    queryKey: ['builds'],
    queryFn: async () => {
      const res = await api.get<Build[]>('/builds', { params: { limit: 100 } })
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/builds/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] })
      toast.success('Build deleted')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete build')
    },
  })

  const handleDelete = (build: Build) => {
    if (confirm(`Delete build for ${build.rim.manufacturer} ${build.rim.model}?`)) {
      deleteMutation.mutate(build.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-scenic-900 dark:text-scenic-100">Build History</h2>
        <p className="text-scenic-500 dark:text-scenic-400">Past wheel builds and print sheets</p>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-8 text-scenic-500 dark:text-scenic-400">Loading...</div>
        ) : builds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-scenic-500 dark:text-scenic-400 mb-4">No builds yet</p>
            <Link to="/" className="btn btn-primary">
              Create Your First Build
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {builds.map((build) => (
              <div
                key={build.id}
                className="border border-scenic-200 dark:border-scenic-600 rounded-lg p-4 hover:border-scenic-300 dark:hover:border-scenic-500 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-scenic-900 dark:text-scenic-100">
                          {build.rim.manufacturer} {build.rim.model}
                        </h3>
                        <p className="text-sm text-scenic-600 dark:text-scenic-300">
                          {build.hub.manufacturer} {build.hub.model}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-scenic-900 dark:text-scenic-100">
                          {build.spoke_length_left}mm / {build.spoke_length_right}mm
                        </div>
                        <div className="text-xs text-scenic-500 dark:text-scenic-400">
                          {build.spoke_count} spokes | {build.cross_pattern_left}x / {build.cross_pattern_right}x
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-scenic-500 dark:text-scenic-400">
                      {build.customer_name && (
                        <span>Customer: {build.customer_name}</span>
                      )}
                      <span>Built by {build.created_by.name}</span>
                      <span>{formatDate(build.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/build/${build.id}/print`}
                      className="btn btn-secondary text-sm whitespace-nowrap"
                    >
                      View / Print
                    </Link>
                    <button
                      onClick={() => handleDelete(build)}
                      className="btn text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
