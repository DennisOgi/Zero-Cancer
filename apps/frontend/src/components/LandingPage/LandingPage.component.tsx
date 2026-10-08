import Cta from './Cta'
import Education from './Education'
import Faq from './Faq'
import Fight from './Fight'
import CommunityEvents from './CommunityEvents'
import Find from './Find'
import Footer from './Footer'
import Hero from './Hero'
import How from './How'
import Navbar from './Navbar'
import Stats from './Stats'
import Why from './Why'
import AnonymousDonate from './AnonymousDonate'

function LandingPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Stats />
      <Why />
      <Education />
      <Fight />
      <AnonymousDonate />
      <Find />
      <CommunityEvents />
      <How />
      <Faq />
      <Cta />
      <Footer />
    </div>
  )
}

export default LandingPage
