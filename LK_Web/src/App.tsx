import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import styled from 'styled-components'
import { KakaoLoginButton } from './components/KakaoLoginButton'
import { KakaoCallback } from './pages/KakaoCallback'
import { useAuth } from './hooks/useAuth'
import { NicknameModal } from './components/NicknameModal'

function AppContent() {
  const [activeTab, setActiveTab] = useState('Detection')
  const { user, isAuthenticated, logout, displayName } = useAuth()
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false)

  const tabs = ['Detection', 'Tracking', 'Counting', 'Analysis']

  return (
    <AppContainer>
      <Header>
        <Navbar>
          <LogoGroup>
            <Logo>Little Kids</Logo>
            <NavLinks>
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#solutions">Solutions</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
              <NavLink href="#about">About</NavLink>
            </NavLinks>
          </LogoGroup>
          <AuthSection>
            {isAuthenticated && user ? (
              <UserInfo>
                <UserNameButton type="button" onClick={() => setNicknameModalOpen(true)}>
                  {displayName}
                </UserNameButton>
                <LogoutButton onClick={logout}>로그아웃</LogoutButton>
              </UserInfo>
            ) : (
              <KakaoLoginButton />
            )}
          </AuthSection>
        </Navbar>
      </Header>

      <MainContent>
        <HeroSection>
          <HeroTitle>
            당신의 축구 영상을 데이터로 바꿔주는 가장 쉬운 방법
          </HeroTitle>
          <HeroSubtitle>
            Player tracking · Event detection · Tactical insights — All automated.
          </HeroSubtitle>
          <CTAButtons>
            <Button variant="primary">Get Started</Button>
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
      <NicknameModal isOpen={nicknameModalOpen} onClose={() => setNicknameModalOpen(false)} />
    </AppContainer>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
      </Routes>
    </BrowserRouter>
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
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`

const LogoGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 40px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #7c3aed;
`

const NavLinks = styled.div`
  display: flex;
  gap: 32px;

  @media (max-width: 768px) {
    gap: 16px;
    font-size: 14px;
  }
`

const AuthSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const UserNameButton = styled.button`
  font-size: 14px;
  font-weight: 600;
  color: #7c3aed;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;

  &:hover {
    color: #6d28d9;
  }
`

const LogoutButton = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background-color: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #374151;
    border-color: #d1d5db;
    background-color: #f9fafb;
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
  padding: 64px 32px;

  @media (max-width: 768px) {
    padding: 32px 16px;
  }
`

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 48px;
  padding: 24px 0 16px;
`

const HeroTitle = styled.h1`
  font-size: 43px;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
  margin-bottom: 24px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 40px;
  }
`

const HeroSubtitle = styled.p`
  font-size: 20px;
  color: #6b7280;
  margin-bottom: 40px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`

const CTAButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 14px 32px;
  font-size: 16px;
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
  margin-top: 64px;
`

const ImageContainer = styled.div`
  width: 100%;
  margin-bottom: 32px;
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
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`

const Tab = styled.button<{ $active?: boolean }>`
  background-color: transparent;
  color: ${props => props.$active ? '#7c3aed' : '#6b7280'};
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? '#7c3aed' : 'transparent'};
  transition: all 0.2s;

  &:hover {
    color: #7c3aed;
  }
`