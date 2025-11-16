import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../hooks/useAuth'
import { NicknameModal } from '../components/NicknameModal'

export function ProjectsPage() {
  const { isAuthenticated, loading, displayName } = useAuth()
  const navigate = useNavigate()
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false)

  // 인증되지 않은 사용자는 랜딩 페이지로 돌려보내기
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  return (
    <PageWrapper>
      <Sidebar>
        <SidebarHeader>
          <Brand>
            {/* <BrandLogo>LK</BrandLogo> */}
            <BrandText>Little Kids</BrandText>
          </Brand>
        </SidebarHeader>

        <SidebarSectionLabel>Workspace</SidebarSectionLabel>
        <NavList>
          <NavItem active>Matches</NavItem>
        </NavList>

        <SidebarFooter>
          <SidebarSectionLabel>Account</SidebarSectionLabel>
          <UserChip type="button" onClick={() => setNicknameModalOpen(true)}>
            {displayName}
          </UserChip>
        </SidebarFooter>
      </Sidebar>

      <MainArea>
        <MainInner>
          <SubTitle>Matches</SubTitle>
          <Title>Build tatics to win the games</Title>
          <Description>
            Upload your match, analyze it, and enjoy your games.
          </Description>

          <ActionsRow>
            <PrimaryButton type="button" onClick={() => navigate('/matches/new')}>
              + New Matches
            </PrimaryButton>
          </ActionsRow>
        </MainInner>
      </MainArea>
      <NicknameModal
        isOpen={nicknameModalOpen}
        onClose={() => setNicknameModalOpen(false)}
      />
    </PageWrapper>
  )
}

const PageWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f3f4f6;
`

const Sidebar = styled.aside`
  width: 260px;
  background: radial-gradient(circle at top left, #111827 55%, #4f46e5);
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 20px 18px;
  gap: 16px;

  @media (max-width: 900px) {
    display: none;
  }
`

const SidebarHeader = styled.div`
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(249, 250, 251, 0.08);
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const BrandText = styled.div`
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
`

const SidebarSectionLabel = styled.div`
  margin-top: 8px;
  margin-bottom: 4px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
`

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const NavItem = styled.button<{ active?: boolean }>`
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background-color: ${({ active }) =>
    active ? 'rgba(243, 244, 246, 0.12)' : 'transparent'};
  color: ${({ active }) => (active ? '#f9fafb' : '#e5e7eb')};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background-color: rgba(243, 244, 246, 0.1);
  }
`

const SidebarFooter = styled.div`
  margin-top: auto;
  margin-bottom: 20px;
`

const UserChip = styled.button`
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: 999px;
  background-color: rgba(31, 41, 55, 0.85);
  font-size: 13px;
  color: #e5e7eb;
  width: 210px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: none;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: rgba(31, 41, 55, 0.95);
  }
`

const MainArea = styled.main`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
`

const MainInner = styled.div`
  max-width: 720px;
  width: 100%;
  background-color: #ffffff;
  border-radius: 24px;
  padding: 48px 40px 40px;
  box-shadow:
    0 24px 50px rgba(15, 23, 42, 0.12),
    0 0 0 1px rgba(148, 163, 184, 0.16);

  @media (max-width: 640px) {
    padding: 32px 20px 24px;
  }
`

const SubTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #4b5563;
  margin-bottom: 10px;
`

const Title = styled.h1`
  font-size: 32px;
  line-height: 1.2;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;

  @media (max-width: 640px) {
    font-size: 26px;
  }
`

const Description = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 24px;
`

const ActionsRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const PrimaryButton = styled.button`
  padding: 12px 24px;
  border-radius: 999px;
  border: none;
  background-color: #6366f1;
  color: #f9fafb;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.35);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background-color 0.12s ease;

  &:hover {
    background-color: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 18px 38px rgba(79, 70, 229, 0.45);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 10px 26px rgba(79, 70, 229, 0.3);
  }
`


