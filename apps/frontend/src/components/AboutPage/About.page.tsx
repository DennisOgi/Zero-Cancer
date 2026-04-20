import { Link } from '@tanstack/react-router'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { Card, CardContent } from '@/components/shared/ui/card'
import { useState } from 'react'
import { Search, Users, Video, BookOpen, Heart, MapPin } from 'lucide-react'

export default function AboutPage() {
  const [selectedState, setSelectedState] = useState('')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="wrapper relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6">
              <Heart className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Embark on Your Path to Wellness with ZeroCancer
            </h1>
            <p className="text-lg md:text-xl leading-relaxed opacity-95 max-w-3xl mx-auto">
              At Zerocancer, we advocate for collaborative efforts among all stakeholders,
              emphasizing the integration of information and biotechnology in the
              comprehensive fight against cancers. Our commitment extends across all facets
              of prevention and management, working diligently until the incidence and
              impact of this menace are minimized to zero in Africa.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="wrapper">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                About ZeroCancer
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-lg leading-relaxed text-gray-700">
                  Zerocancer is a comprehensive cancer prevention initiative dedicated to
                  minimizing the occurrence of new cases of cervical, breast, prostate, and
                  colon cancers. Our multifaceted approach involves extensive awareness
                  campaigns, public enlightenment, immunization, and screening initiatives.
                </p>
                <p className="text-lg leading-relaxed text-gray-700">
                  We firmly believe that early detection is key to effective treatment and, as
                  such, we prioritize identifying individuals at high risk through thorough high
                  performance screening processes.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="text-center p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary">
                  <div className="text-4xl font-bold text-primary mb-2">4</div>
                  <div className="text-sm text-gray-600">Cancer Types</div>
                </Card>
                <Card className="text-center p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary">
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <div className="text-sm text-gray-600">Commitment</div>
                </Card>
                <Card className="text-center p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </Card>
                <Card className="text-center p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary">
                  <div className="text-4xl font-bold text-primary mb-2">0</div>
                  <div className="text-sm text-gray-600">Our Goal</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explorer Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="wrapper">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Center Explorer
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-6"></div>
              <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto">
                The ZeroCancer Center Explorer is a search tool that simplifies the discovery
                of cancer centers in the country. Users input their state and region, and the
                tool instantly displays all available centers in that area.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto shadow-xl border-0">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">
                      Select a State
                    </label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Choose your state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abuja">Abuja</SelectItem>
                        <SelectItem value="enugu">Enugu</SelectItem>
                        <SelectItem value="lagos">Lagos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedState && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                      <label className="block text-sm font-semibold mb-3 text-gray-700">
                        Select a Region
                      </label>
                      <Select>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Choose your region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="region1">Region 1</SelectItem>
                          <SelectItem value="region2">Region 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button 
                    className="w-full h-12 text-base font-semibold" 
                    disabled={!selectedState}
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search Centers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Facts Section */}
      <section className="py-20 bg-white">
        <div className="wrapper">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Important Facts
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            </div>
            
            <div className="space-y-6">
              <Card className="border-l-4 border-l-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-xl">1</span>
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed flex-1">
                      Cervical cancer is the second most common cancer in females in Africa
                      after breast cancer. It is a cause of chronic disease, morbidity, and
                      death.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-xl">2</span>
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed flex-1">
                      According to the Nigerian Institute of Medical Research (NIMR), <strong className="text-primary">22 women
                      die everyday</strong> from cervical cancer while <strong className="text-primary">32 new cases</strong> are reported each
                      day.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-xl">3</span>
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed flex-1">
                      Just like other cancers, cervical cancer is <strong className="text-green-600">preventable and treatable</strong> if
                      detected early.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="wrapper">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Video className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Educational Videos
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {['Cervical Cancer Awareness', 'Self Sampling Guide', 'Zerocancer Envoys'].map((title) => (
                <Card key={title} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-0">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
                      <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg
                          className="w-10 h-10 text-primary ml-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-center group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Envoys Section */}
      <section className="py-20 bg-white">
        <div className="wrapper">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Zerocancer Envoys
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-6"></div>
              <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto mb-8">
                We have a list of professional healthcare workers who are passionate about our
                cause, ranging from different specialties. Are you a healthcare worker? Why
                don't you join us and fight the battle for zero cancer in Africa.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 text-base font-semibold">
                <Users className="w-5 h-5 mr-2" />
                Join as Envoy
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold">
                <BookOpen className="w-5 h-5 mr-2" />
                List Envoys
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="wrapper">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Our Blog
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-6"></div>
              <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto">
                Explore our blog section for insightful articles and updates on cancer
                prevention, screening, and treatment. Stay informed about the latest
                advancements, expert opinions, and personal stories that inspire hope and
                resilience.
              </p>
            </div>

            <Card className="overflow-hidden shadow-xl border-0 hover:shadow-2xl transition-shadow">
              <div className="md:flex">
                <div className="md:w-2/5 bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center p-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
                  <div className="relative z-10 text-center">
                    <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                      <span className="text-white text-sm font-semibold uppercase tracking-wide">Featured</span>
                    </div>
                    <BookOpen className="w-16 h-16 text-white mx-auto" />
                  </div>
                </div>
                <CardContent className="md:w-3/5 p-8 md:p-10">
                  <h3 className="text-2xl font-bold mb-4 leading-tight">
                    Unlocking the Path: Your Guide to HPV Testing for Cervical Cancer
                  </h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    In this guide, we uncover the vital aspects of an effective HPV test,
                    shedding light on the importance of identifying high-risk strains and
                    oncoproteins. Learn the ins and outs of preparation for the test,
                    locating a nearby screening facility...
                  </p>
                  <Button asChild size="lg" className="font-semibold">
                    <Link to="/blog">
                      Visit Blog
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </Button>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary/90 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="wrapper relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Connect with Top Tier Healthcare Professionals
            </h2>
            <p className="text-lg md:text-xl mb-10 opacity-95">
              Stay tuned for a smarter, more convenient way to care for yourself with our
              innovative Digital App. Get notified when it's available for download.
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white text-gray-900 h-14 text-base border-0 shadow-lg"
                />
                <Button variant="secondary" size="lg" className="h-14 px-8 font-semibold whitespace-nowrap">
                  Get Notified
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
