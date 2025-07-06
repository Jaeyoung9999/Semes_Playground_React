// 프롬프트 아이템 타입 정의
export type PromptItem = {
  title: string;
  subtitle: string;
};

// 추천 프롬프트 데이터 (클로드 스타일)
export const suggestedPrompts: PromptItem[] = [
  {
    title: 'JavaScript 기초 개념을',
    subtitle: '쉽게 설명해주세요',
  },
  {
    title: '효율적인 업무 관리',
    subtitle: '방법을 알려주세요',
  },
  {
    title: '창의적인 아이디어를',
    subtitle: '브레인스토밍해주세요',
  },
  {
    title: 'React와 Vue의',
    subtitle: '차이점을 비교해주세요',
  },
  {
    title: '코드 리뷰 시',
    subtitle: '체크해야 할 포인트를 알려주세요',
  },
  {
    title: '프레젠테이션을',
    subtitle: '효과적으로 구성하는 방법',
  },
];
