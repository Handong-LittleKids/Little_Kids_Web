import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type MatchFile = {
  id: string
  file: File
}

export function CreateMatchPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [matchName, setMatchName] = useState('')
  const [files, setFiles] = useState<MatchFile[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return

    const remainingSlots = 2 - files.length
    const accepted = selected.slice(0, remainingSlots)

    if (selected.length > remainingSlots) {
      window.alert('경기 영상은 최대 2개까지 업로드할 수 있습니다.')
    }

    const nextFiles: MatchFile[] = [
      ...files,
      ...accepted.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
      })),
    ]
    setFiles(nextFiles)
    // 같은 파일 다시 선택 가능하도록 value 초기화
    e.target.value = ''
  }

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleCancel = () => {
    navigate('/projects')
  }

  const handleCreate = () => {
    // 실제 업로드/생성 로직은 이후에 구현 예정
    console.log('Match name:', matchName)
    console.log('Files:', files.map((f) => f.file))
    window.alert('업로드 이후 동작은 다음 단계에서 구현할 예정입니다.')
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
                  {files.map(({ id, file }) => (
                    <FileItem key={id}>
                      <FileName>{file.name}</FileName>
                      <RemoveFileButton type="button" onClick={() => handleRemoveFile(id)}>
                        제거
                      </RemoveFileButton>
                    </FileItem>
                  ))}
                </FileList>
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
              disabled={!matchName || files.length === 0}
              onClick={handleCreate}
            >
              Create Match
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

const FileList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
`

const FileItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;

  &:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }
`

const FileName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
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


