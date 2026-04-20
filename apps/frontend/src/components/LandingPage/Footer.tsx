import logo from '@/assets/images/logo-blue.svg'
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export default function Footer() {
  return (
    <footer className="">
      <div className="wrapper pb-12">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="space-y-4 lg:col-span-2">
            <img src={logo} alt="ZeroCancer Logo" className="w-32" />
            <p className="text-muted-foreground max-w-md">
              No matter where you are, we're here for you. Reach out, get to
              know us better, and discover what we can do for your brand. We're
              ready when you are.
            </p>
          </div>
          <div className="">
            <h3 className="text-xl font-bold">Quick Links</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Link to="/" className="block hover:text-primary">
                  Home
                </Link>
                <a href="#" className="block hover:text-primary">
                  My Account
                </a>
                <a href="#" className="block hover:text-primary">
                  Make a Donation
                </a>
                <a href="#" className="block hover:text-primary">
                  Find a Screening Center
                </a>
              </div>
              <div className="space-y-2">
                <a href="#" className="block hover:text-primary">
                  Contact Us
                </a>
                <Link to="/about" className="block hover:text-primary">
                  About Us
                </Link>
                <a href="#" className="block hover:text-primary">
                  FAQs
                </a>
                <Link to="/blog" className="block hover:text-primary">
                  Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>Zerocancer © 2025. All Rights Reserved</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary">
              Terms
            </a>
            <a href="#" className="hover:text-primary">
              Privacy policy
            </a>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-primary hover:text-primary/80">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-primary hover:text-primary/80">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-primary hover:text-primary/80">
              <Linkedin size={20} />
            </a>
            <a href="#" className="text-primary hover:text-primary/80">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
