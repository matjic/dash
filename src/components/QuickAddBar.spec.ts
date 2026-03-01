import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Ionic Vue components
vi.mock('@ionic/vue', () => ({
  IonIcon: {
    name: 'IonIcon',
    template: '<span class="ion-icon"></span>',
    props: ['icon'],
  },
}));

// Mock the composable
const mockCreateItem = vi.fn(() => Promise.resolve());
const mockSetSearchText = vi.fn();
const mockSearchText = { value: '' };

vi.mock('../composables/useItems', () => ({
  useItems: () => ({
    createItem: mockCreateItem,
    setSearchText: mockSetSearchText,
    searchText: mockSearchText,
  }),
}));

// Mock NLP parser
vi.mock('../services/nlpParser', () => ({
  parseQuickInput: vi.fn((text: string) => ({
    title: text,
    priority: 'none',
    isRecurring: false,
    recurrenceRule: undefined,
    dueDate: undefined,
  })),
}));

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import QuickAddBar from './QuickAddBar.vue';

describe('QuickAddBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchText.value = '';
  });

  const mountOptions = {
    global: {
      stubs: {
        IonIcon: {
          template: '<span class="ion-icon"></span>',
        },
      },
    },
  };

  it('should render input field', () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('placeholder')).toContain('Search or add');
  });

  it('should render add button', () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const addButton = wrapper.find('.add-button');
    expect(addButton.exists()).toBe(true);
  });

  it('should disable add button when input is empty', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('');
    await nextTick();

    const addButton = wrapper.find('.add-button');
    expect(addButton.attributes('disabled')).toBeDefined();
  });

  it('should enable add button when input has text', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('Buy groceries');
    await nextTick();

    const addButton = wrapper.find('.add-button');
    expect(addButton.attributes('disabled')).toBeUndefined();
  });

  it('should call setSearchText when input changes', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('test query');

    expect(mockSetSearchText).toHaveBeenCalledWith('test query');
  });

  it('should create item when add button is clicked', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('Buy groceries');

    const addButton = wrapper.find('.add-button');
    await addButton.trigger('click');

    expect(mockCreateItem).toHaveBeenCalled();
  });

  it('should create item when Enter is pressed', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('Buy groceries');
    await input.trigger('keyup.enter');

    expect(mockCreateItem).toHaveBeenCalled();
  });

  it('should clear input after creating item', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input') as any;
    await input.setValue('Buy groceries');
    await input.trigger('keyup.enter');

    await nextTick();

    expect(mockSetSearchText).toHaveBeenCalledWith('');
  });

  it('should show clear button when input has text', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('test');
    await nextTick();

    const clearIcon = wrapper.find('.clear-icon');
    expect(clearIcon.exists()).toBe(true);
  });

  it('should hide clear button when input is empty', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('');
    await nextTick();

    const clearIcon = wrapper.find('.clear-icon');
    expect(clearIcon.exists()).toBe(false);
  });

  it('should clear input when clear button is clicked', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('test');
    await nextTick();

    const clearIcon = wrapper.find('.clear-icon');
    await clearIcon.trigger('click');

    expect(mockSetSearchText).toHaveBeenCalledWith('');
  });

  it('should not create item with empty input', async () => {
    const wrapper = mount(QuickAddBar, mountOptions);

    const input = wrapper.find('input');
    await input.setValue('   '); // whitespace only
    await input.trigger('keyup.enter');

    expect(mockCreateItem).not.toHaveBeenCalled();
  });
});
