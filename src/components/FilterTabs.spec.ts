import { describe, it, expect, vi } from 'vitest';

// Mock Ionic Vue to avoid Stencil/web component issues in tests
vi.mock('@ionic/vue', () => ({
  IonSegment: {
    name: 'IonSegment',
    template: '<div class="ion-segment" :value="value" @ionChange="$attrs.onIonChange"><slot /></div>',
    props: ['value', 'modelValue'],
  },
  IonSegmentButton: {
    name: 'IonSegmentButton',
    template: '<button class="ion-segment-button" :value="value"><slot /></button>',
    props: ['value'],
  },
  IonLabel: {
    name: 'IonLabel',
    template: '<div class="ion-label"><slot /></div>',
  },
}));

import { mount } from '@vue/test-utils';
import FilterTabs from './FilterTabs.vue';

describe('FilterTabs', () => {
  it('should render all filter options', () => {
    const wrapper = mount(FilterTabs, {
      props: {
        modelValue: 'all',
      },
      global: {
        stubs: {
          IonSegment: {
            template: '<div class="ion-segment"><slot /></div>',
            props: ['value'],
          },
          IonSegmentButton: {
            template: '<button class="ion-segment-button"><slot /></button>',
            props: ['value'],
          },
          IonLabel: {
            template: '<div class="ion-label"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('All');
    expect(wrapper.text()).toContain('Tasks');
    expect(wrapper.text()).toContain('Events');
  });

  it('should emit update:modelValue when filter changes', async () => {
    const wrapper = mount(FilterTabs, {
      props: {
        modelValue: 'all',
      },
      global: {
        stubs: {
          IonSegment: {
            template: '<div class="ion-segment" @click="$emit(\'ionChange\', { detail: { value: \'tasks\' } })"><slot /></div>',
            props: ['value'],
            emits: ['ionChange'],
          },
          IonSegmentButton: {
            template: '<button class="ion-segment-button"><slot /></button>',
          },
          IonLabel: {
            template: '<div class="ion-label"><slot /></div>',
          },
        },
      },
    });

    const segment = wrapper.find('.ion-segment');
    await segment.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tasks']);
  });

  it('should accept different modelValue prop', () => {
    const wrapper = mount(FilterTabs, {
      props: {
        modelValue: 'tasks',
      },
      global: {
        stubs: {
          IonSegment: {
            template: '<div class="ion-segment" :value="value"><slot /></div>',
            props: ['value'],
          },
          IonSegmentButton: true,
          IonLabel: true,
        },
      },
    });

    expect(wrapper.props('modelValue')).toBe('tasks');
  });
});
