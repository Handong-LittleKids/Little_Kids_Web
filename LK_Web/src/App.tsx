import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { KakaoLoginButton } from './components/KakaoLoginButton'
import { KakaoCallback } from './pages/KakaoCallback'
import { useAuth } from './hooks/useAuth'
import { ProjectsPage } from './pages/ProjectsPage'
import { CreateMatchPage } from './pages/CreateMatchPage'
import { MatchDetailPage } from './pages/MatchDetailPage'
import { useKakaoLogin } from './hooks/useKakaoLogin'
import logoBlack from './assets/logo_black.png'

function AppContent() {
  const { user, isAuthenticated, logout, displayName, loading } = useAuth()
  const navigate = useNavigate()
  const { handleKakaoLogin, loading: kakaoLoading } = useKakaoLogin()

  // 로그인 상태라면 랜딩 페이지 대신 프로젝트 화면으로 자동 이동
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/projects', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])


  return (
    <AppContainer>
      <Header>
        <Navbar>
          <LogoGroup>
            <Logo src={logoBlack} alt="Little Kids" />
            <NavLinks>
              {/* <NavLink href="#features">Features</NavLink>
              <NavLink href="#solutions">Solutions</NavLink>
              <NavLink href="#pricing">Pricing</NavLink> */}
              <NavLink href="#usage">사용 방법</NavLink>
              <NavLink href="#about">About Us</NavLink>
            </NavLinks>
          </LogoGroup>
          <AuthSection>
            {isAuthenticated && user ? (
              <UserInfo>
                <UserNameLabel>{displayName}</UserNameLabel>
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
            You can be a football tactics analyst, too
          </HeroTitle>
          <HeroSubtitle>
            Player tracking · Event detection · Tactical insights — All automated.
          </HeroSubtitle>
          <CTAButtons>
            <Button
              variant="primary"
              type="button"
              onClick={handleKakaoLogin}
              disabled={kakaoLoading}
            >
              {kakaoLoading ? '로그인 중...' : 'Get Started'}
            </Button>
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
        </ImageSection>

        <UsageSection id="usage">
          <UsageTitle>사용 방법</UsageTitle>
          <UsageList>
            <UsageItem>
              <UsageNumber>1</UsageNumber>
              <UsageText>1대의 고정된 카메라가 필요합니다.</UsageText>
            </UsageItem>
            <UsageItem>
              <UsageNumber>2</UsageNumber>
              <UsageText>경기장 전체를 담을 수 있어야 합니다. (예시 영상을 봐주세요)</UsageText>
            </UsageItem>
            <UsageItem>
              <UsageNumber>3</UsageNumber>
              <UsageText>
                화질이 높을수록 분석에 용이합니다. 낮은 경우에는 분석이 제대로 이뤄지지 않을 수 있습니다.
                <UsageNote>(예시 영상의 경우 4K 24fps로 진행하였습니다.)</UsageNote>
              </UsageText>
            </UsageItem>
          </UsageList>
        </UsageSection>
      </MainContent>
    </AppContainer>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/matches/new" element={<CreateMatchPage />} />
        <Route path="/matches/:matchId" element={<MatchDetailPage />} />
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

const Logo = styled.img`
  height: 32px;
  width: auto;
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

const UserNameLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #7c3aed;
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
  margin-top: 30px;
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
  max-height: 50vh;
`

const UsageSection = styled.section`
  margin-top: 80px;
  padding: 48px 32px;
  background-color: #f9fafb;
  border-radius: 16px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    margin-top: 48px;
    padding: 32px 24px;
  }
`

const UsageTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 32px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 24px;
  }
`

const UsageList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const UsageItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

const UsageNumber = styled.div`
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
`

const UsageText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
  flex: 1;
  padding-top: 4px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`

const UsageNote = styled.span`
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
  font-style: italic;
`