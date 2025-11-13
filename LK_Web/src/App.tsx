import { useState } from 'react'
import styled from 'styled-components'

function App() {
  const [activeTab, setActiveTab] = useState('Detection')

  const tabs = ['Detection', 'Tracking', 'Counting', 'Analysis']

  return (
    <AppContainer>
      <Header>
        <Navbar>
          <Logo>Little Kids</Logo>
          <NavLinks>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#solutions">Solutions</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#about">About</NavLink>
          </NavLinks>
        </Navbar>
      </Header>

      <MainContent>
        <HeroSection>
          <HeroTitle>
            당신의 축구 영상을 데이터로 바꿔주는 가장 쉬운 방법.
          </HeroTitle>
          <HeroSubtitle>
            Player tracking · Event detection · Tactical insights — All automated.
          </HeroSubtitle>
          <CTAButtons>
            <Button variant="primary">Get Started</Button>
            <Button variant="secondary">Request a Demo</Button>
          </CTAButtons>
        </HeroSection>

        <ImageSection>
          <ImageContainer>
            <MainVideo 
              src="/mainpage.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              controls={false}
              onError={(e) => {
                const target = e.target as HTMLVideoElement
                const error = target.error
                if (error) {
                  console.error('Video error code:', error.code)
                  console.error('Video error message:', error.message)
                  // MediaError codes:
                  // 1 = MEDIA_ERR_ABORTED
                  // 2 = MEDIA_ERR_NETWORK
                  // 3 = MEDIA_ERR_DECODE
                  // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
                  console.error('Error code meaning:', {
                    1: 'MEDIA_ERR_ABORTED - The user aborted the loading',
                    2: 'MEDIA_ERR_NETWORK - A network error occurred',
                    3: 'MEDIA_ERR_DECODE - An error occurred while decoding',
                    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The video format is not supported'
                  }[error.code] || 'Unknown error')
                }
              }}
              onLoadedData={() => {
                console.log('Video loaded successfully')
              }}
              onLoadStart={() => {
                console.log('Video loading started...')
              }}
            >
              Your browser does not support the video tag.
            </MainVideo>
          </ImageContainer>
          <TabsContainer>
            {tabs.map((tab) => (
              <Tab
                key={tab}
                $active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Tab>
            ))}
          </TabsContainer>
        </ImageSection>
      </MainContent>
    </AppContainer>
  )
}

export default App


const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #ffffff;
`

const Header = styled.header`
  position: sticky;
  top: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  z-index: 100;
`

const Navbar = styled.nav`
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #7c3aed;
`

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
    font-size: 0.9rem;
  }
`

const NavLink = styled.a`
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #7c3aed;
  }
`

const MainContent = styled.main`
  max-width: 1280px;
  margin: 0 auto;
  padding: 4rem 2rem;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 4rem;
  padding: 2rem 0;
`

const HeroTitle = styled.h1`
  font-size: 2.7rem;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
  margin-bottom: 1.5rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2.5rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  border: ${props => props.variant === 'secondary' ? '2px solid #7c3aed' : 'none'};
  background-color: ${props => props.variant === 'secondary' ? 'transparent' : '#7c3aed'};
  color: ${props => props.variant === 'secondary' ? '#7c3aed' : '#ffffff'};

  &:hover {
    background-color: ${props => props.variant === 'secondary' ? '#f3f4f6' : '#6d28d9'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`

const ImageSection = styled.section`
  margin-top: 4rem;
`

const ImageContainer = styled.div`
  width: 100%;
  margin-bottom: 2rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  background-color: #000;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const MainVideo = styled.video`
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  max-height: 80vh;
`

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
`

const Tab = styled.button<{ $active?: boolean }>`
  background-color: transparent;
  color: ${props => props.$active ? '#7c3aed' : '#6b7280'};
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? '#7c3aed' : 'transparent'};
  transition: all 0.2s;

  &:hover {
    color: #7c3aed;
  }
`