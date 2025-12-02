import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../hooks/useAuth'
import { getMatch, startAnalysis, getPresignedUrl, generateLLMReport, getLLMReport, type Match } from '../utils/api'

export function MatchDetailPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const { matchId } = useParams<{ matchId: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [loadingMatch, setLoadingMatch] = useState(true)
  const [presignedUrls, setPresignedUrls] = useState<{
    csv?: string
    video?: string
  }>({})
  const [generatingReport, setGeneratingReport] = useState(false)

  // 인증되지 않은 사용자는 랜딩 페이지로 돌려보내기
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  // 매치 데이터 불러오기
  useEffect(() => {
    if (isAuthenticated && !loading && matchId) {
      loadMatch()
    }
  }, [isAuthenticated, loading, matchId])

  const loadMatch = async () => {
    if (!matchId) return
    try {
      setLoadingMatch(true)
      const data = await getMatch(matchId)
      setMatch(data)
      
      // 분석 완료된 경우 Presigned URL 가져오기
      if (data.status === 'completed') {
        const urls: { csv?: string; video?: string } = {}
        
        if (data.csv_url) {
          try {
            const csvResult = await getPresignedUrl(matchId, 'csv')
            urls.csv = csvResult.presigned_url
          } catch (error) {
            console.error('CSV Presigned URL 가져오기 실패:', error)
          }
        }
        
        if (data.result_video_url) {
          try {
            const videoResult = await getPresignedUrl(matchId, 'video')
            urls.video = videoResult.presigned_url
          } catch (error) {
            console.error('Video Presigned URL 가져오기 실패:', error)
          }
        }
        
        setPresignedUrls(urls)
      }
    } catch (error: any) {
      console.error('매치 불러오기 실패:', error)
      window.alert(error?.message || '매치를 불러올 수 없습니다.')
      navigate('/projects')
    } finally {
      setLoadingMatch(false)
    }
  }

  const handleStartAnalysis = async () => {
    if (!matchId) return
    
    if (!window.confirm('분석을 시작하시겠습니까? 이 작업은 시간이 걸릴 수 있습니다.')) {
      return
    }

    try {
      await startAnalysis(matchId)
      window.alert('분석이 시작되었습니다. 잠시 후 페이지를 새로고침해주세요.')
      // 매치 데이터 다시 불러오기
      await loadMatch()
    } catch (error: any) {
      console.error('분석 시작 실패:', error)
      window.alert(error?.message || '분석 시작에 실패했습니다.')
    }
  }

  const handleGenerateLLMReport = async () => {
    if (!matchId) return
    
    if (!window.confirm('LLM 경기 분석 리포트를 생성하시겠습니까?')) {
      return
    }

    try {
      setGeneratingReport(true)
      const result = await generateLLMReport(matchId)
      window.alert('LLM 리포트가 성공적으로 생성되었습니다!')
      // 매치 데이터 다시 불러오기
      await loadMatch()
    } catch (error: any) {
      console.error('LLM 리포트 생성 실패:', error)
      window.alert(error?.message || 'LLM 리포트 생성에 실패했습니다.')
    } finally {
      setGeneratingReport(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
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

  if (loadingMatch) {
    return (
      <PageWrapper>
        <LoadingContainer>
          <LoadingText>Loading match...</LoadingText>
        </LoadingContainer>
      </PageWrapper>
    )
  }

  if (!match) {
    return (
      <PageWrapper>
        <ErrorContainer>
          <ErrorText>Match not found</ErrorText>
          <BackButton onClick={() => navigate('/projects')}>Back to Matches</BackButton>
        </ErrorContainer>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Sidebar>
        <SidebarHeader>
          <Brand>
            <BrandText>Little Kids</BrandText>
          </Brand>
        </SidebarHeader>

        <SidebarSectionLabel>Workspace</SidebarSectionLabel>
        <NavList>
          <NavItem active>Matches</NavItem>
        </NavList>

        <SidebarFooter>
          <BackToProjectsButton type="button" onClick={() => navigate('/projects')}>
            ← Back to Matches
          </BackToProjectsButton>
        </SidebarFooter>
      </Sidebar>

      <MainArea>
        <Header>
          <HeaderTop>
            <TitleSection>
              <MatchName>{match.name}</MatchName>
              <MatchMeta>
                <StatusBadge $color={getStatusColor(match.status)}>
                  {getStatusText(match.status)}
                </StatusBadge>
                <MetaText>{formatDate(match.created_at)}</MetaText>
              </MatchMeta>
            </TitleSection>
            <HeaderActions>
              {match.status === 'created' && (
                <AnalyzeButton type="button" onClick={handleStartAnalysis}>
                  Start Analysis
                </AnalyzeButton>
              )}
              {match.status === 'analyzing' && (
                <AnalyzingButton type="button" disabled>
                  Analyzing...
                </AnalyzingButton>
              )}
              {match.status === 'completed' && (
                <CompletedButton type="button" disabled>
                  Analysis Completed
                </CompletedButton>
              )}
              {match.status === 'failed' && (
                <FailedButton type="button" onClick={handleStartAnalysis}>
                  Retry Analysis
                </FailedButton>
              )}
            </HeaderActions>
          </HeaderTop>
        </Header>

        <Content>
          <Section>
            <SectionTitle>Match Information</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Status</InfoLabel>
                <InfoValue>
                  <StatusBadge $color={getStatusColor(match.status)}>
                    {getStatusText(match.status)}
                  </StatusBadge>
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Videos</InfoLabel>
                <InfoValue>{match.videos.length}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Created</InfoLabel>
                <InfoValue>{formatDate(match.created_at)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Last Updated</InfoLabel>
                <InfoValue>{formatDate(match.updated_at)}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </Section>

          <Section>
            <SectionTitle>Videos</SectionTitle>
            <VideosList>
              {match.videos.map((video, index) => (
                <VideoCard key={video.match_id}>
                  <VideoCardHeader>
                    <VideoNumber>Video {index + 1}</VideoNumber>
                    <VideoId>ID: {video.match_id}</VideoId>
                  </VideoCardHeader>
                  <VideoCardBody>
                    {video.frame_url ? (
                      <VideoThumbnail>
                        <ThumbnailImage 
                          src={video.frame_url.startsWith('http') 
                            ? video.frame_url 
                            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${video.frame_url}`} 
                          alt={`Video ${index + 1} thumbnail`}
                          onError={(e) => {
                            console.error(`Video ${index + 1} 썸네일 로드 실패:`, video.frame_url)
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            // 플레이스홀더 표시
                            const placeholder = target.nextElementSibling as HTMLElement
                            if (placeholder) {
                              placeholder.style.display = 'flex'
                            }
                          }}
                          onLoad={() => {
                            console.log(`Video ${index + 1} 썸네일 로드 성공:`, video.frame_url)
                          }}
                        />
                        <VideoThumbnailPlaceholder style={{ display: 'none' }}>
                          Video {index + 1}
                        </VideoThumbnailPlaceholder>
                      </VideoThumbnail>
                    ) : (
                      <VideoThumbnail>
                        <VideoThumbnailPlaceholder>
                          Video {index + 1}
                        </VideoThumbnailPlaceholder>
                      </VideoThumbnail>
                    )}
                    <VideoInfo>
                      <VideoInfoItem>
                        <VideoInfoLabel>Points:</VideoInfoLabel>
                        <VideoInfoValue>{video.points.length} points</VideoInfoValue>
                      </VideoInfoItem>
                      {video.video_url && (
                        <VideoInfoItem>
                          <VideoInfoLabel>Video URL:</VideoInfoLabel>
                          <VideoInfoValue>
                            <VideoLink href={video.video_url} target="_blank" rel="noopener noreferrer">
                              View Video
                            </VideoLink>
                          </VideoInfoValue>
                        </VideoInfoItem>
                      )}
                    </VideoInfo>
                  </VideoCardBody>
                </VideoCard>
              ))}
            </VideosList>
          </Section>

          {match.status === 'completed' && (match.csv_url || match.result_video_url) && (
            <Section>
              <SectionTitle>Analysis Results</SectionTitle>
              <ResultsContainer>
                {match.result_video_url && (
                  <ResultItem>
                    <ResultLabel>2D Homography Visualization</ResultLabel>
                    <ResultVideoContainer>
                      <ResultVideo
                        src={presignedUrls.video || match.result_video_url}
                        controls
                        preload="metadata"
                        onError={async (e) => {
                          console.error('결과 영상 로드 실패:', match.result_video_url)
                          // Presigned URL이 없거나 만료된 경우 다시 가져오기
                          if (!presignedUrls.video && matchId) {
                            try {
                              const videoResult = await getPresignedUrl(matchId, 'video')
                              const target = e.target as HTMLVideoElement
                              target.src = videoResult.presigned_url
                              setPresignedUrls(prev => ({ ...prev, video: videoResult.presigned_url }))
                            } catch (error) {
                              console.error('Presigned URL 재생성 실패:', error)
                              const target = e.target as HTMLVideoElement
                              target.style.display = 'none'
                              const errorMsg = target.nextElementSibling as HTMLElement
                              if (errorMsg) {
                                errorMsg.style.display = 'block'
                              }
                            }
                          } else {
                            const target = e.target as HTMLVideoElement
                            target.style.display = 'none'
                            const errorMsg = target.nextElementSibling as HTMLElement
                            if (errorMsg) {
                              errorMsg.style.display = 'block'
                            }
                          }
                        }}
                      />
                      <VideoErrorMsg style={{ display: 'none' }}>
                        영상을 불러올 수 없습니다.
                      </VideoErrorMsg>
                    </ResultVideoContainer>
                    <ResultActions>
                      <DownloadButton
                        href={presignedUrls.video || match.result_video_url}
                        download={`${match.name}_result.mp4`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          // Presigned URL이 없으면 가져오기
                          if (!presignedUrls.video && matchId) {
                            e.preventDefault()
                            try {
                              const videoResult = await getPresignedUrl(matchId, 'video')
                              setPresignedUrls(prev => ({ ...prev, video: videoResult.presigned_url }))
                              // 새 창에서 다운로드
                              window.open(videoResult.presigned_url, '_blank')
                            } catch (error) {
                              console.error('Presigned URL 가져오기 실패:', error)
                              window.alert('다운로드에 실패했습니다. 다시 시도해주세요.')
                            }
                          }
                        }}
                      >
                        Download Video
                      </DownloadButton>
                    </ResultActions>
                  </ResultItem>
                )}
                
                {match.csv_url && (
                  <ResultItem>
                    <ResultLabel>Tracking Data (CSV)</ResultLabel>
                    <ResultDescription>
                      Player and ball tracking data with world coordinates
                    </ResultDescription>
                    <ResultActions>
                      <DownloadButton
                        href={presignedUrls.csv || match.csv_url}
                        download={`${match.name}_tracks.csv`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          // Presigned URL이 없으면 가져오기
                          if (!presignedUrls.csv && matchId) {
                            e.preventDefault()
                            try {
                              const csvResult = await getPresignedUrl(matchId, 'csv')
                              setPresignedUrls(prev => ({ ...prev, csv: csvResult.presigned_url }))
                              // 새 창에서 다운로드
                              window.open(csvResult.presigned_url, '_blank')
                            } catch (error) {
                              console.error('Presigned URL 가져오기 실패:', error)
                              window.alert('다운로드에 실패했습니다. 다시 시도해주세요.')
                            }
                          }
                        }}
                      >
                        Download CSV
                      </DownloadButton>
                    </ResultActions>
                  </ResultItem>
                )}
              </ResultsContainer>
            </Section>
          )}

          {match.status === 'analyzing' && match.progress !== undefined && (
            <Section>
              <SectionTitle>Analysis Progress</SectionTitle>
              <ProgressContainer>
                <ProgressBar>
                  <ProgressFill $width={match.progress} />
                </ProgressBar>
                <ProgressText>
                  {match.progress}% {match.status_message ? `- ${match.status_message}` : ''}
                </ProgressText>
              </ProgressContainer>
            </Section>
          )}

          {match.status === 'completed' && (
            <Section>
              <SectionTitle>AI Match Analysis Report</SectionTitle>
              {match.llm_report_url ? (
                <ResultsContainer>
                  <ResultItem>
                    <ResultLabel>LLM Analysis Report</ResultLabel>
                    {match.llm_report_summary && (
                      <ResultDescription>
                        {match.llm_report_summary.substring(0, 200)}...
                      </ResultDescription>
                    )}
                    <ReportIframeContainer>
                      <ReportIframe
                        src={match.llm_report_url}
                        title="AI Match Analysis Report"
                        onError={(e) => {
                          console.error('리포트 로드 실패:', match.llm_report_url)
                          const target = e.target as HTMLIFrameElement
                          target.style.display = 'none'
                          const errorMsg = target.nextElementSibling as HTMLElement
                          if (errorMsg) {
                            errorMsg.style.display = 'block'
                          }
                        }}
                      />
                      <ReportErrorMsg style={{ display: 'none' }}>
                        리포트를 불러올 수 없습니다. 새로고침하거나 다시 생성해주세요.
                      </ReportErrorMsg>
                    </ReportIframeContainer>
                    <ResultActions>
                      <DownloadButton
                        href={match.llm_report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download Report
                      </DownloadButton>
                    </ResultActions>
                  </ResultItem>
                </ResultsContainer>
              ) : (
                <ResultActions>
                  <AnalyzeButton
                    type="button"
                    onClick={handleGenerateLLMReport}
                    disabled={generatingReport}
                  >
                    {generatingReport ? 'Generating Report...' : 'Generate AI Analysis Report'}
                  </AnalyzeButton>
                </ResultActions>
              )}
            </Section>
          )}
        </Content>
      </MainArea>
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
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background-color: rgba(243, 244, 246, 0.1);
  }
`

const SidebarFooter = styled.div`
  margin-top: auto;
  margin-bottom: 20px;
`

const BackToProjectsButton = styled.button`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: transparent;
  font-size: 14px;
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
  overflow-y: auto;
`

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

const LoadingText = styled.div`
  font-size: 16px;
  color: #6b7280;
`

const ErrorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`

const ErrorText = styled.div`
  font-size: 18px;
  color: #6b7280;
`

const BackButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
`

const Header = styled.header`
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 24px 32px;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
`

const TitleSection = styled.div`
  flex: 1;
`

const MatchName = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`

const MatchMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ $color }) => $color};
  background-color: ${({ $color }) => `${$color}15`};
`

const MetaText = styled.span`
  font-size: 14px;
  color: #6b7280;
`

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`

const AnalyzeButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #6366f1;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #4f46e5;
    transform: translateY(-1px);
  }
`

const AnalyzingButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #3b82f6;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.7;
`

const CompletedButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #22c55e;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.7;
`

const FailedButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #dc2626;
    transform: translateY(-1px);
  }
`

const Content = styled.div`
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  @media (max-width: 768px) {
    padding: 24px 16px;
    gap: 24px;
  }
`

const Section = styled.section`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const InfoLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
`

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #111827;
`

const VideosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const VideoCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.15s ease;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`

const VideoCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`

const VideoNumber = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`

const VideoId = styled.div`
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
`

const VideoCardBody = styled.div`
  padding: 16px;
  display: flex;
  gap: 16px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`

const VideoThumbnail = styled.div`
  flex-shrink: 0;
  width: 200px;
  height: 112px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f3f4f6;
  position: relative;

  @media (max-width: 640px) {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
`

const VideoThumbnailPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  position: absolute;
  top: 0;
  left: 0;
`

const VideoInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const VideoInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const VideoInfoLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
`

const VideoInfoValue = styled.div`
  font-size: 13px;
  color: #111827;
`

const VideoLink = styled.a`
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const ResultItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ResultLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`

const ResultDescription = styled.div`
  font-size: 14px;
  color: #6b7280;
`

const ResultVideoContainer = styled.div`
  width: 100%;
  max-width: 800px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000000;
  position: relative;
`

const ResultVideo = styled.video`
  width: 100%;
  height: auto;
  display: block;
`

const VideoErrorMsg = styled.div`
  padding: 40px;
  text-align: center;
  color: #ef4444;
  background-color: #fef2f2;
  border-radius: 8px;
`

const ReportIframeContainer = styled.div`
  width: 100%;
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
`

const ReportIframe = styled.iframe`
  width: 100%;
  min-height: 800px;
  border: none;
  display: block;
`

const ReportErrorMsg = styled.div`
  padding: 40px;
  text-align: center;
  color: #ef4444;
  background-color: #fef2f2;
  border-radius: 8px;
`

const ResultActions = styled.div`
  display: flex;
  gap: 12px;
`

const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #6366f1;
  background-color: #6366f1;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #4f46e5;
    border-color: #4f46e5;
    transform: translateY(-1px);
  }
`

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ProgressBar = styled.div`
  width: 100%;
  height: 24px;
  background-color: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`

const ProgressFill = styled.div<{ $width: number }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: linear-gradient(90deg, #3b82f6, #6366f1);
  border-radius: 12px;
  transition: width 0.3s ease;
`

const ProgressText = styled.div`
  font-size: 14px;
  color: #6b7280;
  text-align: center;
`

