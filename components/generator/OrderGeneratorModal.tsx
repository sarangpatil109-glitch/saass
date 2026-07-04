'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { FileArchive, X } from 'lucide-react'
import { GeneratorForm } from '@/components/generator/GeneratorForm'

export function OrderGeneratorModal({ order, customers, products, templates }: { order: any, customers: any[], products: any[], templates: any[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <FileArchive className="h-4 w-4" /> Generate Product Instance
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl my-8 relative">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Generate Customer ZIP Build</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <GeneratorForm 
                customers={customers} 
                products={products} 
                templates={templates} 
                orderId={order.id}
                defaultCustomerId={order.customer_id}
                defaultProductId={order.product_id}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
