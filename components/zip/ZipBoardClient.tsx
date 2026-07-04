'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Search, Download, FileArchive, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, Archive, Send } from 'lucide-react'
import { requestZipGeneration, completeZipGeneration, logZipDownload, updateDeliveryStatus, updateZipStatus, deleteZipRecord } from '@/app/actions/zip'

export function ZipBoardClient({ zips, deliveries, customers, products, versions }: any) {
  const [activeTab, setActiveTab] = useState('zips')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  
  const [selectedProduct, setSelectedProduct] = useState('')

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsGenerating(true)
    setGenerationProgress(10)
    
    const formData = new FormData(e.currentTarget)
    const result = await requestZipGeneration(formData)
    
    if (result.error) {
      alert(result.error)
      setIsGenerating(false)
      setGenerationProgress(0)
      return
    }

    // Simulate Build Process (Branding Replacement, Building, Compressing)
    let progress = 10
    const interval = setInterval(() => {
      progress += 20
      setGenerationProgress(progress)
      if (progress >= 90) clearInterval(interval)
    }, 800)

    setTimeout(async () => {
      clearInterval(interval)
      setGenerationProgress(100)
      await completeZipGeneration(result.zipId, formData.get('customer_id') as string)
      setIsGenerating(false)
      setIsModalOpen(false)
      setGenerationProgress(0)
      window.location.reload()
    }, 4000)
  }

  const handleDownload = async (zipId: string, url: string) => {
    await logZipDownload(zipId)
    window.open(url, '_blank')
    window.location.reload()
  }

  const handleDelivery = async (deliveryId: string, zipId: string, status: string) => {
    await updateDeliveryStatus(deliveryId, zipId, status)
    window.location.reload()
  }

  const handleDelete = async (zipId: string) => {
    if(confirm("Are you sure you want to delete this failed ZIP?")) {
      await deleteZipRecord(zipId)
      window.location.reload()
    }
  }

  const handleArchive = async (zipId: string) => {
    if(confirm("Archive this ZIP?")) {
      await updateZipStatus(zipId, 'Archived')
      window.location.reload()
    }
  }

  const filteredZips = zips.filter((z: any) => 
    z.business_name.toLowerCase().includes(search.toLowerCase()) || 
    z.id.includes(search)
  )

  const filteredDeliveries = deliveries.filter((d: any) => 
    d.generated_zips?.business_name?.toLowerCase().includes(search.toLowerCase()) || 
    d.id.includes(search)
  )

  return (
    <div className="space-y-6">
      
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border-blue-100 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500">Total ZIPs</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{zips.length}</div>
        </Card>
        <Card className="p-4 bg-white border-indigo-100 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500">Today's ZIPs</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {zips.filter((z:any) => new Date(z.created_at).toDateString() === new Date().toDateString()).length}
          </div>
        </Card>
        <Card className="p-4 bg-white border-green-100 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500">Delivered</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{zips.filter((z:any) => z.status === 'Delivered').length}</div>
        </Card>
        <Card className="p-4 bg-white border-orange-100 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500">Pending Deliveries</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{deliveries.filter((d:any) => d.status === 'Pending').length}</div>
        </Card>
        <Card className="p-4 bg-white border-red-100 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500">Failed ZIPs</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{zips.filter((z:any) => z.status === 'Failed').length}</div>
        </Card>
      </div>

      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('zips')} className={`pb-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'zips' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Generated ZIPs</button>
        <button onClick={() => setActiveTab('deliveries')} className={`pb-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'deliveries' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Delivery Management</button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 border-b items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input type="search" placeholder="Search business name or ID..." className="w-full pl-9" value={search} onChange={(e: any) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <FileArchive className="h-4 w-4" /> Generate ZIP
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          {activeTab === 'zips' ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">ZIP ID / Date</th>
                  <th className="px-6 py-4">Customer & Business</th>
                  <th className="px-6 py-4">Product & Version</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredZips.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-500">No ZIPs found.</td></tr> : 
                  filteredZips.map((zip: any) => (
                    <tr key={zip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-gray-900 truncate max-w-[120px]">{zip.id}</div>
                        <div className="text-gray-500 text-xs mt-1">{new Date(zip.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{zip.business_name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{zip.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{zip.product?.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">v{zip.product_version?.version_string}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${
                          zip.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          zip.status === 'Downloaded' ? 'bg-indigo-100 text-indigo-700' :
                          zip.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          zip.status === 'Generating' ? 'bg-yellow-100 text-yellow-700' :
                          zip.status === 'Failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {zip.status === 'Generating' && <RefreshCw className="h-3 w-3 animate-spin" />}
                          {zip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {['Completed', 'Downloaded', 'Delivered'].includes(zip.status) && (
                          <Button variant="outline" size="sm" onClick={() => handleDownload(zip.id, zip.file_url)} title="Download ZIP">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {zip.status !== 'Archived' && zip.status !== 'Generating' && (
                          <Button variant="outline" size="sm" onClick={() => handleArchive(zip.id)} title="Archive">
                            <Archive className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}
                        {zip.status === 'Failed' && (
                          <Button variant="outline" size="sm" onClick={() => handleDelete(zip.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">ZIP Details</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Delivery Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDeliveries.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-500">No deliveries found.</td></tr> : 
                  filteredDeliveries.map((delivery: any) => (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{delivery.generated_zips?.business_name}</div>
                        <div className="text-gray-500 text-xs mt-0.5 font-mono truncate max-w-[120px]">{delivery.zip_id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {delivery.customer?.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          delivery.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          delivery.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {delivery.status === 'Pending' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleDelivery(delivery.id, delivery.zip_id, 'Delivered')} className="text-green-600 border-green-200 hover:bg-green-50">
                              <CheckCircle className="h-4 w-4 mr-1" /> Mark Delivered
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelivery(delivery.id, delivery.zip_id, 'Failed')} className="text-red-600 border-red-200 hover:bg-red-50">
                              <AlertCircle className="h-4 w-4 mr-1" /> Mark Failed
                            </Button>
                          </>
                        )}
                        {delivery.status === 'Delivered' && (
                          <span className="text-xs text-gray-500">Delivered {new Date(delivery.delivery_date).toLocaleDateString()}</span>
                        )}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Generate Customer ZIP Build</h3>
            </div>
            
            {isGenerating ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-6">
                <RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Generating Production Build...</h4>
                  <p className="text-sm text-gray-500 mb-6">Replacing brands, building assets, and compressing.</p>
                  <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${generationProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{generationProgress}% Complete</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Customer *</label>
                    <Select name="customer_id" required>
                      {customers.map((c:any) => <option key={c.id} value={c.id}>{c.profiles?.full_name} ({c.email})</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Product *</label>
                    <Select name="product_id" required value={selectedProduct} onChange={(e:any) => setSelectedProduct(e.target.value)}>
                      <option value="" disabled>Select Product</option>
                      {products.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Product Version *</label>
                    <Select name="product_version_id" required disabled={!selectedProduct}>
                      {versions.filter((v:any) => v.product_id === selectedProduct).map((v:any) => (
                        <option key={v.id} value={v.id}>v{v.version_string} {v.is_current_stable ? '(Stable)' : ''}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Branding Details (Auto-Replacement)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-medium mb-1">Business Name *</label><Input name="business_name" required /></div>
                    <div><label className="block text-xs font-medium mb-1">Owner Name *</label><Input name="owner_name" required /></div>
                    <div><label className="block text-xs font-medium mb-1">Support Email *</label><Input name="email" type="email" required /></div>
                    <div><label className="block text-xs font-medium mb-1">Support Phone *</label><Input name="phone" required /></div>
                    <div><label className="block text-xs font-medium mb-1">Primary Color (Hex)</label><Input name="primary_color" placeholder="#000000" /></div>
                    <div><label className="block text-xs font-medium mb-1">Secondary Color (Hex)</label><Input name="secondary_color" placeholder="#ffffff" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-medium mb-1">Logo URL *</label><Input name="logo_url" type="url" required placeholder="https://..." /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-medium mb-1">Full Address</label><Input name="address" /></div>
                    <div><label className="block text-xs font-medium mb-1">City</label><Input name="city" /></div>
                    <div><label className="block text-xs font-medium mb-1">State / Country</label><div className="flex gap-2"><Input name="state" placeholder="State" /><Input name="country" placeholder="Country" /></div></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t flex justify-end gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                    <Send className="h-4 w-4" /> Start Generation
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
