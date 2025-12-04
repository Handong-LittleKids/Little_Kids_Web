import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../hooks/useAuth'
import { NicknameModal } from '../components/NicknameModal'
import { listMatches, deleteMatch, updateMatch, type MatchListItem } from '../utils/api'
import logoWhite from '../assets/logo_white.png'

// 매치 썸네일 컴포넌트
function MatchThumbnailContent({ match }: { match: MatchListItem }) {
  const [imageError, setImageError] = useState(false)
  const thumbnailUrl = match.thumbnail_url
    ? (match.thumbnail_url.startsWith('http') 
        ? match.thumbnail_url 
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${match.thumbnail_url}`)
    : null

  // 디버깅용 로그
  useEffect(() => {
    if (match.thumbnail_url) {
      console.log(`[${match.name}] 원본 thumbnail_url:`, match.thumbnail_url)
      console.log(`[${match.name}] 최종 thumbnailUrl:`, thumbnailUrl)
    } else {
      console.log(`[${match.name}] thumbnail_url이 없습니다.`)
    }
  }, [match.name, match.thumbnail_url, thumbnailUrl])

  if (thumbnailUrl && !imageError) {
    return (
      <>
        <ThumbnailImage
          src={thumbnailUrl}
          alt={match.name}
          onError={(e) => {
            console.error(`[${match.name}] 이미지 로드 실패:`, thumbnailUrl, e)
            setImageError(true)
          }}
          onLoad={() => {
            console.log(`[${match.name}] 이미지 로드 성공:`, thumbnailUrl)
          }}
        />
        <MatchThumbnailPlaceholder style={{ display: 'none' }}>
          {match.name.charAt(0).toUpperCase()}
        </MatchThumbnailPlaceholder>
      </>
    )
  }

  return (
    <MatchThumbnailPlaceholder>
      {match.name.charAt(0).toUpperCase()}
    </MatchThumbnailPlaceholder>
  )
}

export function ProjectsPage() {
  const { isAuthenticated, loading, displayName, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false)
  const [matches, setMatches] = useState<MatchListItem[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // 인증되지 않은 사용자는 랜딩 페이지로 돌려보내기
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  // 매치 목록 불러오기 (페이지 마운트 시 또는 location 변경 시)
  useEffect(() => {
    if (isAuthenticated && !loading) {
      loadMatches()
    }
  }, [isAuthenticated, loading, location.pathname])

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId]
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const loadMatches = async () => {
    try {
      setLoadingMatches(true)
      const data = await listMatches()
      console.log('매치 목록:', data.matches)
      data.matches.forEach(match => {
        console.log(`매치 ${match.name}: thumbnail_url =`, match.thumbnail_url)
      })
      setMatches(data.matches)
    } catch (error) {
      console.error('매치 목록 불러오기 실패:', error)
    } finally {
      setLoadingMatches(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created':
        return '#6b7280'
      case 'analyzing':
        return '#3b82f6'
      case 'completed':
        return '#22c55e'
      case 'failed':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return 'Created'
      case 'analyzing':
        return 'Analyzing'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  const handleMenuClick = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation() // 카드 클릭 이벤트 방지
    setOpenMenuId(openMenuId === matchId ? null : matchId)
  }

  const handleEditName = (match: MatchListItem) => {
    setEditingMatchId(match.match_id)
    setEditingName(match.name)
    setOpenMenuId(null)
  }

  const handleSaveName = async (matchId: string) => {
    if (!editingName.trim()) {
      window.alert('매치 이름을 입력해주세요.')
      return
    }

    try {
      await updateMatch(matchId, editingName.trim())
      await loadMatches() // 목록 새로고침
      setEditingMatchId(null)
      setEditingName('')
      window.alert('매치 이름이 변경되었습니다.')
    } catch (error: any) {
      console.error('매치 이름 변경 실패:', error)
      window.alert(error?.message || '매치 이름 변경에 실패했습니다.')
    }
  }

  const handleDeleteMatch = async (matchId: string, matchName: string) => {
    if (!window.confirm(`"${matchName}" 매치를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      await deleteMatch(matchId)
      await loadMatches() // 목록 새로고침
      setOpenMenuId(null)
      window.alert('매치가 삭제되었습니다.')
    } catch (error: any) {
      console.error('매치 삭제 실패:', error)
      window.alert(error?.message || '매치 삭제에 실패했습니다.')
    }
  }

  return (
    <PageWrapper>
      <Sidebar>
        <SidebarHeader>
          <Brand>
            <BrandLogo src={logoWhite} alt="Little Kids" />
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
          <LogoutButton type="button" onClick={logout}>
            로그아웃
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>

      <MainArea>
        <MainHeader>
          <HeaderTop>
            <HeaderTitle>Little Kids</HeaderTitle>
            <HeaderActions>
              <PrimaryButton type="button" onClick={() => navigate('/matches/new')}>
                + New Match
              </PrimaryButton>
            </HeaderActions>
          </HeaderTop>
          <SearchRow>
            <SearchInput placeholder="Search matches" />
            <SortSelect>
              <SortOption>Sort: Date Edited</SortOption>
            </SortSelect>
          </SearchRow>
        </MainHeader>

        <MatchesGrid>
          {loadingMatches ? (
            <LoadingText>Loading matches...</LoadingText>
          ) : matches.length === 0 ? (
            <EmptyState>
              <EmptyTitle>No matches yet</EmptyTitle>
              <EmptyDescription>
                Create your first match to start analyzing your games.
              </EmptyDescription>
              <PrimaryButton type="button" onClick={() => navigate('/matches/new')}>
                + New Match
              </PrimaryButton>
            </EmptyState>
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.match_id}
                onClick={() => {
                  if (editingMatchId !== match.match_id) {
                    navigate(`/matches/${match.match_id}`)
                  }
                }}
              >
                <MatchCardHeader>
                  <MatchThumbnail>
                    <MatchThumbnailContent match={match} />
                  </MatchThumbnail>
                  <MatchCardMenuContainer>
                    <MatchCardMenu
                      type="button"
                      onClick={(e) => handleMenuClick(e, match.match_id)}
                    >
                      <MenuIcon>⋯</MenuIcon>
                    </MatchCardMenu>
                    {openMenuId === match.match_id && (
                      <MenuDropdown
                        ref={(el) => {
                          menuRefs.current[match.match_id] = el
                        }}
                      >
                        <MenuDropdownItem
                          onClick={() => handleEditName(match)}
                        >
                          이름 변경
                        </MenuDropdownItem>
                        <MenuDropdownDivider />
                        <MenuDropdownItem
                          $danger
                          onClick={() => handleDeleteMatch(match.match_id, match.name)}
                        >
                          삭제
                        </MenuDropdownItem>
                      </MenuDropdown>
                    )}
                  </MatchCardMenuContainer>
                </MatchCardHeader>
                <MatchCardBody>
                  <MatchType>Match Analysis</MatchType>
                  {editingMatchId === match.match_id ? (
                    <NameEditContainer>
                      <NameEditInput
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveName(match.match_id)
                          } else if (e.key === 'Escape') {
                            setEditingMatchId(null)
                            setEditingName('')
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <NameEditButtons>
                        <NameEditButton
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveName(match.match_id)
                          }}
                        >
                          저장
                        </NameEditButton>
                        <NameEditButton
                          type="button"
                          $cancel
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingMatchId(null)
                            setEditingName('')
                          }}
                        >
                          취소
                        </NameEditButton>
                      </NameEditButtons>
                    </NameEditContainer>
                  ) : (
                    <MatchName>{match.name}</MatchName>
                  )}
                  <MatchMeta>
                    <MatchStatus $color={getStatusColor(match.status)}>
                      {getStatusText(match.status)}
                    </MatchStatus>
                    <MatchDate>{formatDate(match.created_at)}</MatchDate>
                  </MatchMeta>
                  <MatchDetails>
                    Public • {match.videos_count} Video{match.videos_count !== 1 ? 's' : ''}
                  </MatchDetails>
                </MatchCardBody>
              </MatchCard>
            ))
          )}
        </MatchesGrid>
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

const BrandLogo = styled.img`
  height: 28px;
  width: auto;
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

const LogoutButton = styled.button`
  margin-top: 8px;
  width: 210px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #e5e7eb;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background-color: rgba(15, 23, 42, 0.75);
    border-color: rgba(209, 213, 219, 0.9);
  }
`

const MainArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px 40px;
  overflow-y: auto;
  background-color: #ffffff;

  @media (max-width: 900px) {
    padding: 24px 20px;
  }
`

const MainHeader = styled.div`
  margin-bottom: 32px;
`

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`

const SearchRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

const SearchInput = styled.input`
  flex: 1;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background-color: #f9fafb;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background-color: #ffffff;
  }

  &::placeholder {
    color: #9ca3af;
  }
`

const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background-color: #ffffff;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`

const SortOption = styled.option``

const MatchesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const LoadingText = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px;
  color: #6b7280;
  font-size: 16px;
`

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 24px;
`

const EmptyTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
`

const EmptyDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
`

const MatchCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    border-color: #d1d5db;
  }
`

const MatchCardHeader = styled.div`
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background-color: #f3f4f6;
  overflow: hidden;
`

const MatchThumbnail = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
`

const MatchThumbnailPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  font-size: 32px;
  font-weight: 700;
  position: absolute;
  top: 0;
  left: 0;
`

const MatchCardMenuContainer = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
`

const MatchCardMenu = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
`

const MenuDropdown = styled.div`
  position: absolute;
  top: 36px;
  right: 0;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 140px;
  overflow: hidden;
  z-index: 100;
`

const MenuDropdownItem = styled.button<{ $danger?: boolean }>`
  width: 100%;
  padding: 10px 16px;
  border: none;
  background-color: transparent;
  text-align: left;
  font-size: 14px;
  color: ${({ $danger }) => ($danger ? '#ef4444' : '#374151')};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ $danger }) => ($danger ? '#fef2f2' : '#f9fafb')};
  }

  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`

const MenuDropdownDivider = styled.div`
  height: 1px;
  background-color: #e5e7eb;
  margin: 4px 0;
`

const NameEditContainer = styled.div`
  margin-bottom: 12px;
`

const NameEditInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #6366f1;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`

const NameEditButtons = styled.div`
  display: flex;
  gap: 8px;
`

const NameEditButton = styled.button<{ $cancel?: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${({ $cancel }) => ($cancel ? '#d1d5db' : '#6366f1')};
  background-color: ${({ $cancel }) => ($cancel ? '#ffffff' : '#6366f1')};
  color: ${({ $cancel }) => ($cancel ? '#374151' : '#ffffff')};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: ${({ $cancel }) => ($cancel ? '#f9fafb' : '#4f46e5')};
    border-color: ${({ $cancel }) => ($cancel ? '#9ca3af' : '#4f46e5')};
  }
`

const MenuIcon = styled.span`
  font-size: 18px;
  color: #374151;
  line-height: 1;
`

const MatchCardBody = styled.div`
  padding: 16px;
`

const MatchType = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin-bottom: 8px;
`

const MatchName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MatchMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`

const MatchStatus = styled.span<{ $color: string }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ $color }) => $color};
  padding: 2px 8px;
  border-radius: 4px;
  background-color: ${({ $color }) => `${$color}15`};
`

const MatchDate = styled.span`
  font-size: 12px;
  color: #6b7280;
`

const MatchDetails = styled.div`
  font-size: 12px;
  color: #9ca3af;
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


