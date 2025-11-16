import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAuth } from '../hooks/useAuth'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function NicknameModal({ isOpen, onClose }: Props) {
  const { user, customNickname, setCustomNickname } = useAuth()
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    if (isOpen) {
      setNickname(customNickname || user?.nickname || '')
    }
  }, [customNickname, isOpen, user?.nickname])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomNickname(nickname)
    onClose()
  }

  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Title>표시할 이름을 입력하세요</Title>
        <Description>닉네임은 로그인 후 왼쪽 사이드바에 표시됩니다.</Description>
        <Form onSubmit={handleSubmit}>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예: 홍길동"
            maxLength={20}
            autoFocus
          />
          <Buttons>
            <Button type="button" onClick={onClose}>
              취소
            </Button>
            <PrimaryButton type="submit">저장</PrimaryButton>
          </Buttons>
        </Form>
        <Hint>입력을 비워두면 기본값 ‘익명의 사용자’가 표시됩니다.</Hint>
      </Modal>
    </Backdrop>
  )
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`

const Modal = styled.div`
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`

const Title = styled.h2`
  font-size: 20px;
  margin-bottom: 8px;
  color: #111827;
`

const Description = styled.p`
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 14px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Input = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
  }
`

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`

const PrimaryButton = styled(Button)`
  background: #7c3aed;
  color: #ffffff;
  border-color: #7c3aed;

  &:hover {
    background: #6d28d9;
  }
`

const Hint = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
`

