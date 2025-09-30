'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Shield,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  Building2,
  TrendingUp,
  Mail,
  User,
  MessageSquare,
  Send
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [isClient, setIsClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    if (isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router, isClient])

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Message sent successfully!', {
        description: 'Thank you for your interest. We\'ll get back to you soon.'
      })

      // Reset form
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      toast.error('Failed to send message', {
        description: 'Please try again or contact us directly.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isClient) {
    return null
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image src="/logo.svg" alt="AccuNode" width={40} height={40} />
              <span className="text-xl font-bold text-gray-900 ml-1">AccuNode</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Login
                </Button>
              </Link>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  const contactSection = document.getElementById('contact-form')
                  contactSection?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Predict Financial Risk
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Advanced ML-powered platform that analyzes company financials and predicts default risk
            with 94% accuracy. Make informed investment decisions with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              onClick={() => {
                const contactSection = document.getElementById('contact-form')
                contactSection?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AccuNode?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to assess financial risk in one powerful platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Analyze both annual and quarterly financial ratios with machine learning models
                trained on comprehensive datasets.
              </p>
            </Card>

            <Card className="p-8 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                94% Accuracy
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Industry-leading prediction accuracy using ensemble models combining
                Random Forest, Gradient Boosting, and Logistic Regression.
              </p>
            </Card>

            <Card className="p-8 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Real-time Processing
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant risk assessments for individual companies or process
                thousands of records with bulk upload capabilities.
              </p>
            </Card>

            <Card className="p-8 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Multi-tenant
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Enterprise-grade platform with complete data isolation, role-based access,
                and organization management capabilities.
              </p>
            </Card>

            <Card className="p-8 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Team Collaboration
              </h3>
              <p className="text-gray-600 leading-relaxed">
                5-tier role system supporting super admins, tenant admins, organization
                admins, members, and individual users.
              </p>
            </Card>

            <Card className="p-8 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Comprehensive Insights
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Rich dashboards with analytics, risk categorization, historical tracking,
                and detailed company analysis reports.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">94%</div>
              <div className="text-gray-600">Prediction Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">450K+</div>
              <div className="text-gray-600">Predictions per Hour</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600">
              Drop us a line!
            </p>
          </div>

          <div className="p-8 md:p-12">
            <form onSubmit={handleContactSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-900 font-medium mb-3 block text-base">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder=""
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="h-14 text-base border-0 border-b border-b-gray-400 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-b-gray-600 focus:outline-none shadow-none placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-900 font-medium mb-3 block text-base">
                    Email*
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder=""
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="h-14 text-base border-0 border-b border-b-gray-400 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-b-gray-600 focus:outline-none shadow-none placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-900 font-medium mb-3 block text-base">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder=""
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows={4}
                    className="text-base border-0 border-b border-b-gray-400 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-b-gray-600 focus:outline-none shadow-none resize-none placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="text-center pt-8">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-base font-semibold rounded-full border-0 min-w-[140px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      SENDING...
                    </>
                  ) : (
                    'SEND'
                  )}
                </Button>
              </div>


            </form>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-gray-400">
              <p>&copy; 2025 AccuNode. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
