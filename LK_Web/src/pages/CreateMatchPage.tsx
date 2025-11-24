import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { uploadMatchVideo, extractFrame, savePitchPoints, getPitchPoints, createMatch, type MatchVideoInfo } from '../utils/api'

type MatchFile = {
  id: string
  file: File
  matchId?: string
  frameUrl?: string
  videoUrl?: string
  points: PitchPoint[]
}

type PitchPoint = { x: number; y: number }

export function CreateMatchPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [matchName, setMatchName] = useState('')
  const [files, setFiles] = useState<MatchFile[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const baseImageRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [savingPoints, setSavingPoints] = useState(false)
  const [extractingFrame, setExtractingFrame] = useState<string | null>(null) // 추출 중인 파일 ID
  const [creatingMatch, setCreatingMatch] = useState(false)

  // 인증되지 않은 사용자는 랜딩 페이지로 돌려보내기
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const handleOpenFileDialog = () => {
    if (files.length >= 2) {
      window.alert('경기 영상은 최대 2개까지 업로드할 수 있습니다.')
      return
    }
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return

    const remainingSlots = 2 - files.length
    const accepted = selected.slice(0, remainingSlots)

    if (selected.length > remainingSlots) {
      window.alert('경기 영상은 최대 2개까지 업로드할 수 있습니다.')
    }

    // 새 파일들을 먼저 추가 (아직 업로드 전)
    const newFileIds = accepted.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      points: [] as PitchPoint[],
    }))

    const nextFiles: MatchFile[] = [...files, ...newFileIds]
    setFiles(nextFiles)

    // 새 파일들을 하나씩 업로드 (임시 저장만)
    for (const newFile of newFileIds) {
      try {
        const result = await uploadMatchVideo(newFile.file)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? { ...f, matchId: result.match_id }
              : f
          )
        )
        // 첫 번째 파일이면 자동으로 선택
        if (nextFiles[0].id === newFile.id) {
          setSelectedFileId(newFile.id)
        }
      } catch (error: any) {
        console.error('매치 비디오 업로드 실패:', error)
        window.alert(error?.message || '매치 비디오 업로드에 실패했습니다.')
        // 실패한 파일 제거
        setFiles((prev) => prev.filter((f) => f.id !== newFile.id))
      }
    }

    // 같은 파일 다시 선택 가능하도록 value 초기화
    e.target.value = ''
  }

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id)
      if (selectedFileId === id) {
        // 삭제한 파일이 선택된 파일이면 다른 파일 선택 또는 null
        setSelectedFileId(next.length > 0 ? next[0].id : null)
      }
      return next
    })
  }

  const handleExtractFrame = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (!file || !file.matchId) {
      window.alert('매치 ID를 찾을 수 없습니다.')
      return
    }

    setExtractingFrame(fileId)
    try {
      const result = await extractFrame(file.matchId)
      // frame_url이 전체 URL이면 그대로 사용, 상대 경로면 API_BASE_URL 추가
      const frameUrl = result.frame_url.startsWith('http')
        ? result.frame_url
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${result.frame_url}`
      
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, frameUrl, videoUrl: result.video_url }
            : f
        )
      )
      window.alert('첫 프레임이 추출되었습니다!')
    } catch (error: any) {
      console.error('프레임 추출 실패:', error)
      window.alert(error?.message || '프레임 추출에 실패했습니다.')
    } finally {
      setExtractingFrame(null)
    }
  }

  const selectedFile = files.find((f) => f.id === selectedFileId)

  // 영상 선택 시 해당 영상의 좌표 불러오기
  useEffect(() => {
    if (selectedFileId && selectedFile?.matchId) {
      // 기존 좌표 불러오기
      getPitchPoints(selectedFile.matchId)
        .then((data) => {
          if (data.points && data.points.length > 0) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === selectedFileId ? { ...f, points: data.points } : f
              )
            )
          }
        })
        .catch((error) => {
          console.error('좌표 불러오기 실패:', error)
        })
    }
  }, [selectedFileId, selectedFile?.matchId])

  // 선택된 파일의 프레임 이미지 로드 후 캔버스 그리기
  const handleImageLoad = () => {
    const img = baseImageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const maxWidth = 520
    const vw = img.naturalWidth || 1280
    const vh = img.naturalHeight || 720
    const scale = maxWidth / vw
    const width = maxWidth
    const height = vh * scale

    canvas.width = width
    canvas.height = height

    // 배경 프레임 그리기
    ctx.drawImage(img, 0, 0, width, height)

    // 저장된 포인트 다시 그리기
    const currentFile = files.find((f) => f.id === selectedFileId)
    if (currentFile && currentFile.points.length > 0) {
      currentFile.points.forEach((p, idx) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#22c55e'
        ctx.fill()

        ctx.font = '14px system-ui'
        ctx.fillStyle = '#f97316'
        ctx.fillText(String(idx + 1), p.x + 8, p.y - 6)
      })
    }
  }

  // points 변경 시 캔버스 다시 그리기
  useEffect(() => {
    if (selectedFile && selectedFile.frameUrl) {
      handleImageLoad()
    }
  }, [selectedFile?.points, selectedFileId])

  const handleCancel = () => {
    navigate('/projects')
  }

  const handleSavePoints = async () => {
    if (!selectedFile || !selectedFile.matchId) return

    setSavingPoints(true)
    try {
      await savePitchPoints(selectedFile.matchId, selectedFile.points)
      window.alert('좌표가 저장되었습니다.')
    } catch (error: any) {
      console.error('좌표 저장 실패:', error)
      window.alert(error?.message || '좌표 저장에 실패했습니다.')
    } finally {
      setSavingPoints(false)
    }
  }

  const handleCreate = async () => {
    // 유효성 검사
    if (!matchName.trim()) {
      window.alert('매치 이름을 입력해주세요.')
      return
    }

    if (files.length === 0) {
      window.alert('최소 1개 이상의 영상을 업로드해주세요.')
      return
    }

    // 모든 파일이 프레임 추출되었는지 확인
    const filesWithoutFrame = files.filter(f => !f.frameUrl)
    if (filesWithoutFrame.length > 0) {
      window.alert('모든 영상의 첫 프레임을 추출해주세요.')
      return
    }

    // 모든 파일이 좌표를 가지고 있는지 확인 (4개)
    const filesWithoutPoints = files.filter(f => f.points.length !== 4)
    if (filesWithoutPoints.length > 0) {
      window.alert('모든 영상에 4개의 좌표를 찍어주세요.')
      return
    }

    setCreatingMatch(true)
    try {
      // 비디오 정보 구성 (1번, 2번 순서대로)
      const videos: MatchVideoInfo[] = files.map((f) => ({
        match_id: f.matchId!,
        video_url: f.videoUrl,
        frame_url: f.frameUrl!,
        points: f.points.map(p => ({ x: p.x, y: p.y }))
      }))

      // 매치 생성
      await createMatch(matchName.trim(), videos)
      
      window.alert('매치가 생성되었습니다!')
      navigate('/projects')
    } catch (error: any) {
      console.error('매치 생성 실패:', error)
      window.alert(error?.message || '매치 생성에 실패했습니다.')
    } finally {
      setCreatingMatch(false)
    }
  }

  return (
    <PageWrapper>
      <PageInner>
        <HeaderRow>
          <TitleBlock>
            <PageTitle>Let&apos;s create your match.</PageTitle>
            <PageSubTitle>Create a new match to analyze your games.</PageSubTitle>
          </TitleBlock>
        </HeaderRow>

        <ContentRow>
          <LeftColumn>
            <SectionTitle>Match Info</SectionTitle>
            <FieldGroup>
              <FieldLabel>Match Name</FieldLabel>
              <TextInput
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="예: LittleKids vs Rivals - 2025.03.15"
              />
            </FieldGroup>

            <UsageGuideSection>
              <UsageGuideTitle>사용 방법</UsageGuideTitle>
              <UsageGuideList>
                <UsageGuideItem>
                  <UsageGuideNumber>1</UsageGuideNumber>
                  <UsageGuideText>
                    꼭 2개의 카메라가 필요합니다.
                    <UsageGuideNote>(2개의 영상이 필요합니다.)</UsageGuideNote>
                  </UsageGuideText>
                </UsageGuideItem>
                <UsageGuideItem>
                  <UsageGuideNumber>2</UsageGuideNumber>
                  <UsageGuideText>서로 마주보는 꼭짓점에서 촬영해야 합니다.</UsageGuideText>
                </UsageGuideItem>
                <UsageGuideItem>
                  <UsageGuideNumber>3</UsageGuideNumber>
                  <UsageGuideText>카메라가 고정되어 있어야 합니다.</UsageGuideText>
                </UsageGuideItem>
                <UsageGuideItem>
                  <UsageGuideNumber>4</UsageGuideNumber>
                  <UsageGuideText>한 카메라가 반코트는 확실하게 촬영해야 합니다.</UsageGuideText>
                </UsageGuideItem>
                <UsageGuideItem>
                  <UsageGuideNumber>5</UsageGuideNumber>
                  <UsageGuideText>
                    화질은 높을수록 좋습니다. 낮은 경우 분석이 제대로 이뤄지지 않을 수 있습니다.
                    <UsageGuideNote>(저희의 경우 4K 24fps로 진행하였습니다.)</UsageGuideNote>
                  </UsageGuideText>
                </UsageGuideItem>
                <UsageGuideItem>
                  <UsageGuideNumber>6</UsageGuideNumber>
                  <UsageGuideText>
                    오른쪽에서 영상을 추가한 뒤, 아래에 나오는 이미지에 반코트의 '꼭지점' 4개를 클릭해서 좌표를 저장해야 합니다.
                  </UsageGuideText>
                </UsageGuideItem>
              </UsageGuideList>
            </UsageGuideSection>
          </LeftColumn>

          <RightColumn>
            <SectionTitle>Match Videos (max 2)</SectionTitle>
            <UploadArea>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleFilesSelected}
              />
              <UploadBox role="button" onClick={handleOpenFileDialog}>
                <PlusIcon>+</PlusIcon>
                <UploadText>Upload your matches.</UploadText>
                <UploadHint>최대 2개의 경기 영상을 업로드할 수 있어요.</UploadHint>
              </UploadBox>

              {files.length > 0 && (
                <FileList>
                  {files.map(({ id, file, matchId, frameUrl, points }) => (
                    <FileItem
                      key={id}
                      $selected={selectedFileId === id}
                      onClick={() => {
                        if (matchId && frameUrl) {
                          setSelectedFileId(id)
                        }
                      }}
                    >
                      <FileInfo>
                        <FileName>{file.name}</FileName>
                        {matchId && (
                          <FileStatus>
                            {frameUrl ? (points.length > 0 ? `좌표 ${points.length}개` : '좌표 없음') : '프레임 미추출'}
                          </FileStatus>
                        )}
                      </FileInfo>
                      <FileActions>
                        {matchId && !frameUrl && (
                          <ExtractFrameButton
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExtractFrame(id)
                            }}
                            disabled={extractingFrame === id}
                          >
                            {extractingFrame === id ? '추출 중...' : '첫 프레임 추출'}
                          </ExtractFrameButton>
                        )}
                        <RemoveFileButton
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile(id)
                          }}
                        >
                          제거
                        </RemoveFileButton>
                      </FileActions>
                    </FileItem>
                  ))}
                </FileList>
              )}

              {selectedFile && selectedFile.frameUrl && (
                <PitchPreviewSection>
                  {/* 이미지를 보이지 않게 로드하고, 캔버스에 그리기 */}
                  <HiddenImage
                    ref={baseImageRef}
                    src={selectedFile.frameUrl}
                    onLoad={handleImageLoad}
                    onError={(e) => {
                      console.error('이미지 로드 실패:', selectedFile.frameUrl)
                      console.error('이미지 로드 에러:', e)
                      window.alert('프레임 이미지를 불러올 수 없습니다. S3 접근 권한을 확인해주세요.')
                    }}
                  />

                  <PitchCanvas
                    ref={canvasRef}
                    onClick={(e) => {
                      const canvas = canvasRef.current
                      const img = baseImageRef.current
                      if (!canvas || !img) return
                      const rect = canvas.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top

                      setFiles((prev) =>
                        prev.map((f) => {
                          if (f.id === selectedFileId) {
                            const next = [...f.points, { x, y }]
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              // 배경 프레임 다시 그리기
                              const width = canvas.width
                              const height = canvas.height
                              ctx.clearRect(0, 0, width, height)
                              ctx.drawImage(img, 0, 0, width, height)

                              // 모든 포인트 다시 그림
                              next.forEach((p, idx) => {
                                ctx.beginPath()
                                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
                                ctx.fillStyle = '#22c55e'
                                ctx.fill()

                                ctx.font = '14px system-ui'
                                ctx.fillStyle = '#f97316'
                                ctx.fillText(String(idx + 1), p.x + 8, p.y - 6)
                              })
                            }
                            return { ...f, points: next }
                          }
                          return f
                        })
                      )
                    }}
                  />
                  <PitchHelpRow>
                    <PitchHelpText>경기장 위를 클릭해서 기준 좌표를 찍어보세요.</PitchHelpText>
                    <ActionButtons>
                      <ClearPointsButton
                        type="button"
                        onClick={() => {
                          setFiles((prev) =>
                            prev.map((f) =>
                              f.id === selectedFileId ? { ...f, points: [] } : f
                            )
                          )
                          const canvas = canvasRef.current
                          const img = baseImageRef.current
                          if (!canvas || !img) return
                          const ctx = canvas.getContext('2d')
                          if (!ctx) return
                          ctx.clearRect(0, 0, canvas.width, canvas.height)
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                        }}
                      >
                        좌표 초기화
                      </ClearPointsButton>
                      {selectedFile && selectedFile.matchId && selectedFile.points.length > 0 && (
                        <SavePointsButton
                          type="button"
                          onClick={handleSavePoints}
                          disabled={savingPoints}
                        >
                          {savingPoints ? '저장 중...' : '좌표 저장'}
                        </SavePointsButton>
                      )}
                    </ActionButtons>
                  </PitchHelpRow>
                </PitchPreviewSection>
              )}
            </UploadArea>
          </RightColumn>
        </ContentRow>

        <FooterRow>
          <FooterSpacer />
          <FooterButtons>
            <FooterButton type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </FooterButton>
            <FooterButton
              type="button"
              variant="primary"
              disabled={!matchName || files.length === 0 || creatingMatch}
              onClick={handleCreate}
            >
              {creatingMatch ? '생성 중...' : 'Create Match'}
            </FooterButton>
          </FooterButtons>
        </FooterRow>
      </PageInner>
    </PageWrapper>
  )
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 40px 32px 32px;

  @media (max-width: 768px) {
    padding: 24px 16px 20px;
  }
`

const PageInner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
`

const HeaderRow = styled.div`
  margin-bottom: 32px;
`

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: #111827;
`

const PageSubTitle = styled.p`
  font-size: 14px;
  color: #6b7280;
`

const ContentRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.2fr);
  gap: 32px;
  align-items: flex-start;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const LeftColumn = styled.section`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px 24px 20px;
  box-shadow:
    0 15px 30px rgba(15, 23, 42, 0.06),
    0 0 0 1px rgba(148, 163, 184, 0.18);
`

const RightColumn = styled.section`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px 24px 20px;
  box-shadow:
    0 15px 30px rgba(15, 23, 42, 0.06),
    0 0 0 1px rgba(148, 163, 184, 0.18);
`

const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6b7280;
  margin-bottom: 16px;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const FieldLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`

const TextInput = styled.input`
  width: 100%;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.5);
  }
`

const UploadArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const HiddenFileInput = styled.input`
  display: none;
`

const UploadBox = styled.div`
  border-radius: 18px;
  border: 2px dashed #d1d5db;
  background: repeating-linear-gradient(
      135deg,
      rgba(249, 250, 251, 0.8),
      rgba(249, 250, 251, 0.8) 8px,
      rgba(243, 244, 246, 0.9) 8px,
      rgba(243, 244, 246, 0.9) 16px
    );
  padding: 32px 24px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.05s ease;

  &:hover {
    border-color: #a855f7;
    box-shadow: 0 15px 30px rgba(129, 140, 248, 0.25);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 8px 18px rgba(129, 140, 248, 0.2);
  }
`

const PlusIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: #f9fafb;
  margin-bottom: 12px;
`

const UploadText = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`

const UploadHint = styled.div`
  font-size: 13px;
  color: #6b7280;
`

const PitchPreviewSection = styled.div`
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const HiddenImage = styled.img`
  display: none;
`

const PitchCanvas = styled.canvas`
  width: 100%;
  max-width: 520px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.25);
  cursor: crosshair;
`

const PitchHelpText = styled.div`
  font-size: 12px;
  color: #6b7280;
`

const PitchHelpRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`

const ClearPointsButton = styled.button`
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  font-size: 11px;
  color: #4b5563;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;

  &:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
`

const SavePointsButton = styled.button`
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #6366f1;
  background-color: #6366f1;
  font-size: 11px;
  color: #ffffff;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;

  &:hover:not(:disabled) {
    background-color: #4f46e5;
    border-color: #4f46e5;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const FileList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
`

const FileItem = styled.li<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  background-color: ${({ $selected }) => ($selected ? '#f3f4f6' : 'transparent')};
  border-left: 3px solid ${({ $selected }) => ($selected ? '#6366f1' : 'transparent')};
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;

  &:hover {
    background-color: ${({ $selected }) => ($selected ? '#e5e7eb' : '#f9fafb')};
  }

  &:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }
`

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

const FileName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
`

const FileStatus = styled.span`
  font-size: 11px;
  color: #6b7280;
`

const FileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ExtractFrameButton = styled.button`
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #2563eb;
    border-color: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const RemoveFileButton = styled.button`
  border: none;
  background: transparent;
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const FooterRow = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const FooterSpacer = styled.div``

const FooterButtons = styled.div`
  display: flex;
  gap: 12px;
`

const FooterButton = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: ${({ variant }) =>
    variant === 'secondary' ? '1px solid #d1d5db' : 'none'};
  background-color: ${({ variant }) =>
    variant === 'secondary' ? '#ffffff' : '#6366f1'};
  color: ${({ variant }) => (variant === 'secondary' ? '#374151' : '#f9fafb')};
  box-shadow: ${({ variant }) =>
    variant === 'secondary'
      ? 'none'
      : '0 10px 24px rgba(79, 70, 229, 0.35)'};
  transition:
    background-color 0.12s ease,
    transform 0.08s ease,
    box-shadow 0.12s ease,
    opacity 0.12s ease;

  &:hover:enabled {
    background-color: ${({ variant }) =>
      variant === 'secondary' ? '#f9fafb' : '#4f46e5'};
    transform: translateY(-1px);
    box-shadow: ${({ variant }) =>
      variant === 'secondary'
        ? '0 4px 10px rgba(15, 23, 42, 0.08)'
        : '0 14px 30px rgba(79, 70, 229, 0.45)'};
  }

  &:active:enabled {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`

const UsageGuideSection = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`

const UsageGuideTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6b7280;
  margin-bottom: 16px;
`

const UsageGuideList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const UsageGuideItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
`

const UsageGuideNumber = styled.div`
  min-width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
`

const UsageGuideText = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  margin: 0;
  flex: 1;
  padding-top: 2px;
`

const UsageGuideNote = styled.span`
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
`


